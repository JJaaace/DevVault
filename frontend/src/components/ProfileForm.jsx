import { useEffect, useState } from 'react'

const defaultValues = {
  firstName: '',
  lastName: '',
  username: '',
  bio: '',
  university: '',
  graduationYear: '',
  country: '',
  state: '',
  githubUrl: '',
  linkedinUrl: '',
  websiteUrl: '',
}

const countryOptions = [
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'India', label: 'India' },
  { value: 'Other', label: 'Other' },
]

const stateOptions = {
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ],
  Canada: ['Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Manitoba'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  India: ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata'],
}

export function ProfileForm({ profile, onSubmit, onCancel, submitting = false, errors = {} }) {
  const [formData, setFormData] = useState(defaultValues)

  useEffect(() => {
    setFormData({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      username: profile?.username ?? '',
      bio: profile?.bio ?? '',
      university: profile?.university ?? '',
      graduationYear: profile?.graduationYear ?? '',
      country: profile?.country ?? '',
      state: profile?.state ?? '',
      githubUrl: profile?.githubUrl ?? '',
      linkedinUrl: profile?.linkedinUrl ?? '',
      websiteUrl: profile?.websiteUrl ?? '',
    })
  }, [profile])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(formData)
  }

  const availableStates = stateOptions[formData.country] || []

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">First name</span>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className={`w-full rounded-lg border bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 ${errors.firstName ? 'border-red-500' : 'border-slate-700'}`}
            placeholder="Alex"
          />
          {errors.firstName ? <p className="mt-2 text-sm text-red-400">{errors.firstName}</p> : null}
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">Last name</span>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className={`w-full rounded-lg border bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 ${errors.lastName ? 'border-red-500' : 'border-slate-700'}`}
            placeholder="Morgan"
          />
          {errors.lastName ? <p className="mt-2 text-sm text-red-400">{errors.lastName}</p> : null}
        </label>
      </div>

      <label className="block text-sm text-slate-300">
        <span className="mb-2 block font-medium text-slate-100">Username</span>
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className={`w-full rounded-lg border bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 ${errors.username ? 'border-red-500' : 'border-slate-700'}`}
          placeholder="alexm"
        />
        {errors.username ? <p className="mt-2 text-sm text-red-400">{errors.username}</p> : null}
      </label>

      <label className="block text-sm text-slate-300">
        <span className="mb-2 block font-medium text-slate-100">Bio</span>
        <textarea
          name="bio"
          rows="4"
          value={formData.bio}
          onChange={handleChange}
          required
          className={`w-full rounded-lg border bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 ${errors.bio ? 'border-red-500' : 'border-slate-700'}`}
          placeholder="Software engineer focused on building reliable user experiences."
        />
        {errors.bio ? <p className="mt-2 text-sm text-red-400">{errors.bio}</p> : null}
      </label>

      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">Country</span>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
          >
            <option value="">Select a country</option>
            {countryOptions.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">State / Province</span>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={!availableStates.length}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">{availableStates.length ? 'Select a state' : 'Select a country first'}</option>
            {availableStates.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">University</span>
          <input
            name="university"
            value={formData.university}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            placeholder="University of Washington"
          />
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">Graduation year</span>
          <input
            name="graduationYear"
            type="number"
            value={formData.graduationYear}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            placeholder="2025"
          />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">GitHub URL</span>
          <input
            name="githubUrl"
            value={formData.githubUrl}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            placeholder="https://github.com/username"
          />
          {errors.githubUrl ? <p className="mt-2 text-sm text-red-400">{errors.githubUrl}</p> : null}
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">LinkedIn URL</span>
          <input
            name="linkedinUrl"
            value={formData.linkedinUrl}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            placeholder="https://linkedin.com/in/username"
          />
          {errors.linkedinUrl ? <p className="mt-2 text-sm text-red-400">{errors.linkedinUrl}</p> : null}
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block font-medium text-slate-100">Website URL</span>
          <input
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            placeholder="https://your-site.com"
          />
          {errors.websiteUrl ? <p className="mt-2 text-sm text-red-400">{errors.websiteUrl}</p> : null}
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}
