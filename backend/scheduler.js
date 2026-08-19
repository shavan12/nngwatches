let db, notify, sse
let intervalId = null

const UPCOMING_THRESHOLDS = [
  { key: '7d', ms: 7 * 24 * 60 * 60 * 1000, label: '7 days' },
  { key: '3d', ms: 3 * 24 * 60 * 60 * 1000, label: '3 days' },
  { key: '24h', ms: 24 * 60 * 60 * 1000, label: '24 hours' },
  { key: '1h', ms: 60 * 60 * 1000, label: '1 hour' },
  { key: '15m', ms: 15 * 60 * 1000, label: '15 minutes' },
]

const ENDING_THRESHOLDS = [
  { key: '24h', ms: 24 * 60 * 60 * 1000, label: '24 hours' },
  { key: '1h', ms: 60 * 60 * 1000, label: '1 hour' },
  { key: '15m', ms: 15 * 60 * 1000, label: '15 minutes' },
]

function resolveStatus(auction) {
  if (auction.manually_ended) return 'ended'
  const now = new Date()
  const start = new Date(auction.start_date)
  const end = new Date(auction.end_date)
  if (now < start) return 'upcoming'
  if (now >= start && now <= end) return 'live'
  return 'ended'
}

function getAuctionImage(auction) {
  const images = db.all('auction_images', { auction_id: auction.id })
    .sort((a, b) => a.sort_order - b.sort_order)
  return images.length > 0 ? images[0].url : (auction.image_url || '')
}

function checkUpcomingAuctions() {
  const auctions = db.all('auctions').filter(a => a.enabled !== 0 && !a.manually_ended)
  const now = Date.now()

  for (const auction of auctions) {
    const status = resolveStatus(auction)
    if (status !== 'upcoming') continue

    const startTime = new Date(auction.start_date).getTime()
    const timeUntilStart = startTime - now
    if (timeUntilStart <= 0) continue

    for (const threshold of UPCOMING_THRESHOLDS) {
      // Send reminder when we're within the threshold window
      // but only if we haven't already (dedup key ensures once-only)
      if (timeUntilStart <= threshold.ms) {
        const image = getAuctionImage(auction)
        notify.createForAllUsers(notify.TYPES.UPCOMING_AUCTION, {
          auctionId: auction.id,
          title: 'Upcoming Auction',
          message: `${auction.name} auction starts in ${threshold.label}. Starting price: $${Number(auction.starting_price).toLocaleString()}.`,
          imageUrl: image,
          actionUrl: `/auction/${auction.id}`,
          dedupKey: `upcoming_${threshold.key}`,
        })
      }
    }
  }
}

function checkAuctionStarts() {
  const auctions = db.all('auctions').filter(a => a.enabled !== 0 && !a.manually_ended)
  const now = new Date()

  for (const auction of auctions) {
    const start = new Date(auction.start_date)
    const end = new Date(auction.end_date)
    if (now >= start && now <= end) {
      // Auction is live — send started notification
      const image = getAuctionImage(auction)
      notify.createForAllUsers(notify.TYPES.AUCTION_STARTED, {
        auctionId: auction.id,
        title: 'Auction Started',
        message: `${auction.name} auction is now LIVE! Starting price: $${Number(auction.starting_price).toLocaleString()}. Start bidding now.`,
        imageUrl: image,
        actionUrl: `/auction/${auction.id}`,
        dedupKey: 'started',
      })

      // Admin notification
      notify.createAdminNotification(notify.TYPES.ADMIN_AUCTION_STARTED, {
        auctionId: auction.id,
        title: 'Auction Started',
        message: `${auction.name} auction is now live.`,
        imageUrl: image,
        actionUrl: `/admin`,
      })
    }
  }
}

function checkEndingSoon() {
  const auctions = db.all('auctions').filter(a => a.enabled !== 0 && !a.manually_ended)
  const now = Date.now()

  for (const auction of auctions) {
    const status = resolveStatus(auction)
    if (status !== 'live') continue

    const endTime = new Date(auction.end_date).getTime()
    const timeUntilEnd = endTime - now
    if (timeUntilEnd <= 0) continue

    for (const threshold of ENDING_THRESHOLDS) {
      if (timeUntilEnd <= threshold.ms) {
        const image = getAuctionImage(auction)
        const bids = db.all('bids', { auction_id: auction.id })
        const highest = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : auction.starting_price

        // Only notify participants, not all users
        notify.createForParticipants(auction.id, notify.TYPES.AUCTION_ENDING, {
          auctionId: auction.id,
          title: 'Auction Ending Soon',
          message: `${auction.name} auction ends in ${threshold.label}. Current bid: $${Number(highest).toLocaleString()}.`,
          imageUrl: image,
          actionUrl: `/auction/${auction.id}`,
          dedupKey: `ending_${threshold.key}`,
        })
      }
    }
  }
}

function checkAuctionEnds() {
  const auctions = db.all('auctions').filter(a => a.enabled !== 0)
  const now = new Date()

  for (const auction of auctions) {
    const status = resolveStatus(auction)
    if (status !== 'ended') continue

    // Check if we already sent end notifications (dedup)
    const bids = db.all('bids', { auction_id: auction.id }).sort((a, b) => b.amount - a.amount)
    const image = getAuctionImage(auction)

    if (bids.length > 0) {
      const winningBid = bids[0]

      // Ensure winner is recorded in auction_winners table
      if (!db.get('auction_winners', { auction_id: auction.id })) {
        db.insert('auction_winners', {
          auction_id: auction.id,
          user_id: winningBid.user_id,
          user_name: winningBid.user_name,
          amount: winningBid.amount,
        })
      }

      // Winner notification
      notify.create(winningBid.user_id, notify.TYPES.AUCTION_WON, {
        auctionId: auction.id,
        title: 'Congratulations! You Won!',
        message: `You won the ${auction.name} auction with a final bid of $${Number(winningBid.amount).toLocaleString()}!`,
        imageUrl: image,
        actionUrl: `/auction/${auction.id}`,
        dedupKey: 'won',
      })

      // Loser notifications (all other participants)
      const participantIds = [...new Set(bids.map(b => b.user_id))]
      for (const uid of participantIds) {
        if (uid === winningBid.user_id) continue
        const user = db.byId('users', uid)
        if (!user || user.role === 'admin') continue
        notify.create(uid, notify.TYPES.AUCTION_LOST, {
          auctionId: auction.id,
          title: 'Auction Ended',
          message: `The ${auction.name} auction has ended. Unfortunately, you were not the winning bidder. Winning bid: $${Number(winningBid.amount).toLocaleString()}.`,
          imageUrl: image,
          actionUrl: `/auction/${auction.id}`,
          dedupKey: 'lost',
        })
      }

      // Ended notification for all participants
      notify.createForParticipants(auction.id, notify.TYPES.AUCTION_ENDED, {
        auctionId: auction.id,
        title: 'Auction Ended',
        message: `${auction.name} auction has ended. Winning bid: $${Number(winningBid.amount).toLocaleString()}.`,
        imageUrl: image,
        actionUrl: `/auction/${auction.id}`,
        dedupKey: 'ended',
      })
    } else {
      // No bids — just notify it ended
      // Admin notification only
    }

    // Admin notification
    notify.createAdminNotification(notify.TYPES.ADMIN_AUCTION_ENDED, {
      auctionId: auction.id,
      title: 'Auction Ended',
      message: `${auction.name} auction has ended.${bids.length > 0 ? ` Winner: ${bids[0].user_name} ($${Number(bids[0].amount).toLocaleString()})` : ' No bids received.'}`,
      imageUrl: image,
      actionUrl: `/admin`,
      dedupKey: 'admin_ended',
    })
  }
}

function processAll() {
  try {
    checkUpcomingAuctions()
    checkAuctionStarts()
    checkEndingSoon()
    checkAuctionEnds()
  } catch (err) {
    console.error('⚠️ Scheduler error:', err.message)
  }
}

function start(_db, _notify, _sse) {
  db = _db
  notify = _notify
  sse = _sse
  
  // Run immediately on start
  setTimeout(processAll, 3000) // 3s delay to let everything initialize
  
  // Then every 60 seconds
  intervalId = setInterval(processAll, 60 * 1000)
  console.log('⏰ Auction scheduler started (60s interval)')
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('⏰ Auction scheduler stopped')
  }
}

module.exports = { start, stop }
