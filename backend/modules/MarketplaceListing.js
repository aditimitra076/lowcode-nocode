import mongoose from 'mongoose'

export const LISTING_STATUSES = ['Draft', 'Pending', 'Approved', 'Rejected']

// A published project submitted to the marketplace (FR-39, FR-40).
// A project can have at most one listing, and only Approved listings are public (FR-46).
const marketplaceListingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 2500 },
    screenshots: { type: [String], default: [], maxlength: 8 },
    tags: { type: [String], default: [], maxlength: 12 },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: 'Draft',
      required: true,
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
)

marketplaceListingSchema.pre('validate', function normalizeTags() {
  if (Array.isArray(this.tags)) {
    this.tags = [
      ...new Set(
        this.tags
          .filter((tag) => typeof tag === 'string' && tag.trim())
          .map((tag) => tag.trim().slice(0, 40)),
      ),
    ].slice(0, 12)
  }

  if (Array.isArray(this.screenshots)) {
    this.screenshots = this.screenshots
      .filter((shot) => typeof shot === 'string' && shot.trim())
      .map((shot) => shot.trim().slice(0, 500))
      .slice(0, 8)
  }
})

const MarketplaceListing = mongoose.model('MarketplaceListing', marketplaceListingSchema)

export default MarketplaceListing
