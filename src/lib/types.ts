export interface GlobeLocation {
  country: string
  countryCode: string  // ISO 3166-1 alpha-3
  role: 'primary' | 'actor' | 'affected'
  lat: number
  lng: number
}

export interface GlobeConnection {
  from: string   // countryCode
  to: string     // countryCode
  label: string
}

export interface Story {
  id: string
  headline: string
  subheadline: string
  readingMinutes: number
  body: string
  medicineNote?: string
  interviewNote?: string
  watchFor?: string[]
  locations: GlobeLocation[]
  connections?: GlobeConnection[]
}

export interface Opening {
  type: 'poem' | 'quote'
  content: string
  attribution: string
  bridge: string
}

export interface Briefing {
  date: string
  generatedAt: string
  opening: Opening
  sections: {
    big: Story[]
    health: Story[]
    innovation: Story[]
    geo: Story[]
    local: Story[]
  }
  globe: {
    locations: GlobeLocation[]
    connections: GlobeConnection[]
  }
}
