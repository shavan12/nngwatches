// ════════════════════════════════════════════════════════
//  HERO SLIDES ROUTES
//  Add this file as: backend/slidesRoutes.js
//  Then add this line at the bottom of server.js (before app.listen):
//    require('./slidesRoutes')(app, db, adminMiddleware)
// ════════════════════════════════════════════════════════

module.exports = function(app, db, admin) {

  // GET all active slides (public)
  app.get('/api/slides', (req, res) => {
    const slides = db.all('hero_slides')
      .filter(s => s.active !== false)
      .sort((a, b) => (a.sort_order||0) - (b.sort_order||0))
    res.json({ data: slides })
  })

  // GET all slides including inactive (admin)
  app.get('/api/slides/all', admin, (req, res) => {
    const slides = db.all('hero_slides')
      .sort((a, b) => (a.sort_order||0) - (b.sort_order||0))
    res.json({ data: slides })
  })

  // POST create slide (admin)
  app.post('/api/slides', admin, (req, res) => {
    const { title_en='', title_ar='', subtitle_en='', subtitle_ar='', cta_en='Shop Now', cta_ar='تسوق الآن', image_url, active=true, sort_order=0 } = req.body
    if (!image_url) return res.status(400).json({ error: 'image_url is required' })
    const slide = db.insert('hero_slides', { title_en, title_ar, subtitle_en, subtitle_ar, cta_en, cta_ar, image_url, active: active?1:0, sort_order: Number(sort_order) })
    res.status(201).json(slide)
  })

  // PUT update slide (admin)
  app.put('/api/slides/:id', admin, (req, res) => {
    const id = Number(req.params.id)
    if (!db.byId('hero_slides', id)) return res.status(404).json({ error: 'Not found' })
    const allowed = ['title_en','title_ar','subtitle_en','subtitle_ar','cta_en','cta_ar','image_url','active','sort_order']
    const updates = {}
    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        updates[f] = f==='active' ? (req.body[f]?1:0) : f==='sort_order' ? Number(req.body[f]) : req.body[f]
      }
    })
    const slide = db.update('hero_slides', id, updates)
    res.json(slide)
  })

  // DELETE slide (admin)
  app.delete('/api/slides/:id', admin, (req, res) => {
    db.delete('hero_slides', Number(req.params.id))
    res.json({ message: 'Slide deleted' })
  })

  // Reorder slides (admin) - POST array of {id, sort_order}
  app.post('/api/slides/reorder', admin, (req, res) => {
    const { order = [] } = req.body
    order.forEach(({ id, sort_order }) => {
      db.update('hero_slides', Number(id), { sort_order: Number(sort_order) })
    })
    res.json({ message: 'Reordered' })
  })
}
