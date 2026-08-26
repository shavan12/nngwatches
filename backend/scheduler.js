let db, notify, sse
let intervalId = null

const UPCOMING_THRESHOLDS = [
  { key: '15m', ms: 15 * 60 * 1000 },
  { key: '1h',  ms: 60 * 60 * 1000 },
  { key: '2h',  ms: 2 * 60 * 60 * 1000 },
  { key: '3h',  ms: 3 * 60 * 60 * 1000 },
  { key: '6h',  ms: 6 * 60 * 60 * 1000 },
  { key: '12h', ms: 12 * 60 * 60 * 1000 },
  { key: '24h', ms: 24 * 60 * 60 * 1000 },
  { key: '3d',  ms: 3 * 24 * 60 * 60 * 1000 },
  { key: '7d',  ms: 7 * 24 * 60 * 60 * 1000 },
]

const ENDING_THRESHOLDS = [
  { key: '15m', ms: 15 * 60 * 1000 },
  { key: '1h',  ms: 60 * 60 * 1000 },
  { key: '3h',  ms: 3 * 60 * 60 * 1000 },
  { key: '24h', ms: 24 * 60 * 60 * 1000 },
]

function formatTimeRemaining(ms) {
  if (ms <= 0) return { en: 'now', ar: 'الآن' }
  const totalMinutes = Math.round(ms / (60 * 1000))
  const totalHours = Math.round(ms / (60 * 60 * 1000))
  const totalDays = Math.round(ms / (24 * 60 * 60 * 1000))

  if (totalMinutes < 60) {
    const mins = Math.max(1, totalMinutes)
    return {
      en: mins === 1 ? '1 minute' : `${mins} minutes`,
      ar: mins === 1 ? 'دقيقة واحدة' : mins === 2 ? 'دقيقتين' : mins <= 10 ? `${mins} دقائق` : `${mins} دقيقة`
    }
  } else if (totalHours < 24) {
    return {
      en: totalHours === 1 ? '1 hour' : `${totalHours} hours`,
      ar: totalHours === 1 ? 'ساعة واحدة' : totalHours === 2 ? 'ساعتين' : totalHours <= 10 ? `${totalHours} ساعات` : `${totalHours} ساعة`
    }
  } else if (totalDays === 1) {
    return {
      en: 'tomorrow',
      ar: 'غداً'
    }
  } else {
    return {
      en: `${totalDays} days`,
      ar: totalDays === 2 ? 'يومين' : totalDays <= 10 ? `${totalDays} أيام` : `${totalDays} يوم`
    }
  }
}

function resolveStatus(auction) {
  if (!auction) return 'ended'
  if (auction.manually_ended) return 'ended'
  const now = Date.now()
  const start = new Date(auction.start_date).getTime()
  const end = new Date(auction.end_date).getTime()
  if (isNaN(start) || isNaN(end)) return 'ended'
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
    if (isNaN(startTime)) continue
    const timeUntilStart = startTime - now
    if (timeUntilStart <= 0) continue

    // Find closest ascending threshold
    for (const threshold of UPCOMING_THRESHOLDS) {
      if (timeUntilStart <= threshold.ms) {
        const image = getAuctionImage(auction)
        const rel = formatTimeRemaining(timeUntilStart)
        notify.createForAllUsers(notify.TYPES.UPCOMING_AUCTION, {
          auctionId: auction.id,
          title: 'Upcoming Auction',
          message: `${auction.name} auction starts in ${rel.en}. Starting price: $${Number(auction.starting_price).toLocaleString()}.`,
          imageUrl: image,
          actionUrl: `/auction/${auction.id}`,
          dedupKey: `upcoming_${threshold.key}`,
          title_ar: 'مزاد قادم',
          message_ar: `مزاد ${auction.name} يبدأ خلال ${rel.ar}. سعر البداية: $${Number(auction.starting_price).toLocaleString()}.`
        })
        break // Only send the closest matching threshold
      }
    }
  }
}

function checkAuctionStarts() {
  const auctions = db.all('auctions').filter(a => a.enabled !== 0 && !a.manually_ended)
  const now = Date.now()

  for (const auction of auctions) {
    const start = new Date(auction.start_date).getTime()
    const end = new Date(auction.end_date).getTime()
    if (!isNaN(start) && !isNaN(end) && now >= start && now <= end) {
      // Auction is live — send started notification
      const image = getAuctionImage(auction)
      notify.createForAllUsers(notify.TYPES.AUCTION_STARTED, {
        auctionId: auction.id,
        title: 'Auction Started',
        message: `${auction.name} auction is now LIVE! Starting price: $${Number(auction.starting_price).toLocaleString()}. Start bidding now.`,
        imageUrl: image,
        actionUrl: `/auction/${auction.id}`,
        dedupKey: 'started',
        title_ar: 'بدأ المزاد',
        message_ar: `مزاد ${auction.name} مباشر الآن! سعر البداية: $${Number(auction.starting_price).toLocaleString()}. ابدأ المزايدة الآن.`
      })

      // Admin notification
      notify.createAdminNotification(notify.TYPES.ADMIN_AUCTION_STARTED, {
        auctionId: auction.id,
        title: 'Auction Started',
        message: `${auction.name} auction is now live.`,
        imageUrl: image,
        actionUrl: `/admin`,
        dedupKey: 'admin_started',
        title_ar: 'بدأ المزاد',
        message_ar: `مزاد ${auction.name} مباشر الآن.`
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
        const rel = formatTimeRemaining(timeUntilEnd)

        // Only notify participants, not all users
        notify.createForParticipants(auction.id, notify.TYPES.AUCTION_ENDING, {
          auctionId: auction.id,
          title: 'Auction Ending Soon',
          message: `${auction.name} auction ends in ${rel.en}. Current bid: $${Number(highest).toLocaleString()}.`,
          imageUrl: image,
          actionUrl: `/auction/${auction.id}`,
          dedupKey: `ending_${threshold.key}`,
          title_ar: 'المزاد ينتهي قريباً',
          message_ar: `مزاد ${auction.name} ينتهي خلال ${rel.ar}. المزايدة الحالية: $${Number(highest).toLocaleString()}.`
        })
        break // Only send the closest matching threshold
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
        title_ar: '!مبروك! لقد فزت',
        message_ar: `لقد فزت بمزاد ${auction.name} بمزايدة نهائية قدرها $${Number(winningBid.amount).toLocaleString()}!`
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
          title_ar: 'انتهى المزاد',
          message_ar: `انتهى مزاد ${auction.name}. للأسف، لم تفز في هذا المزاد. المزايدة الفائزة: $${Number(winningBid.amount).toLocaleString()}.`
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
        title_ar: 'انتهى المزاد',
        message_ar: `انتهى مزاد ${auction.name}. المزايدة الفائزة: $${Number(winningBid.amount).toLocaleString()}.`
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
      title_ar: 'انتهى المزاد',
      message_ar: `انتهى مزاد ${auction.name}.${bids.length > 0 ? ` الفائز: ${bids[0].user_name} ($${Number(bids[0].amount).toLocaleString()})` : ' لا يوجد مزايدات.'}`
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
  setTimeout(processAll, 2000) // 2s delay to let everything initialize
  
  // Then every 10 seconds
  intervalId = setInterval(processAll, 10 * 1000)
  console.log('⏰ Auction scheduler started (10s interval)')
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('⏰ Auction scheduler stopped')
  }
}

module.exports = { start, stop, formatTimeRemaining }
