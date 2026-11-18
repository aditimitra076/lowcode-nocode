import mongoose from 'mongoose'

// Developer profile shown alongside a developer's marketplace listings.
// Contact details let a marketplace visitor reach the developer (FR-43).
const developerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: { type: String, trim: true, maxlength: 80 },
    title: { type: String, trim: true, maxlength: 100 },
    bio: { type: String, trim: true, maxlength: 1500 },
    skills: { type: [String], default: [], maxlength: 24 },
    location: { type: String, trim: true, maxlength: 120 },

    // Contact details.
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 40 },
    website: { type: String, trim: true, maxlength: 240 },
    portfolioUrl: { type: String, trim: true, maxlength: 240 },
    github: { type: String, trim: true, maxlength: 240 },
    linkedin: { type: String, trim: true, maxlength: 240 },
    availableForHire: { type: Boolean, default: true },
  },
  { timestamps: true },
)

developerProfileSchema.pre('validate', function normalizeSkills() {
  if (Array.isArray(this.skills)) {
    this.skills = this.skills
      .filter((skill) => typeof skill === 'string' && skill.trim())
      .map((skill) => skill.trim().slice(0, 40))
      .slice(0, 24)
  }
})

const DeveloperProfile = mongoose.model('DeveloperProfile', developerProfileSchema)

export default DeveloperProfile
