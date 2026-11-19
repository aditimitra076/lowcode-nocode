import { Router } from 'express'
import {
  cloneListing,
  createOrUpdateListing,
  getListing,
  listListings,
  listPendingListings,
  reviewListing,
} from '../controllers/marketplaceController.js'
import requireAuth, { optionalAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Public marketplace browsing needs no authentication (FR-41, FR-42, FR-43).
router.get('/listings', listListings)
router.get('/listings/:id', optionalAuth, getListing)

// Publishing and using a template require a registered account.
router.post('/listings', requireAuth, createOrUpdateListing)
router.post('/listings/:id/clone', requireAuth, cloneListing)

// Administrator review queue (FR-44, FR-45).
router.get('/admin/listings', requireAuth, requireAdmin, listPendingListings)
router.post('/admin/listings/:id/review', requireAuth, requireAdmin, reviewListing)

export default router
