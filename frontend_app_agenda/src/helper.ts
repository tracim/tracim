export interface Profile {
    id: number
    slug: string
    faIcon: string
    hexcolor: `#[0-9A-F]{6}`
    tradKey: string[], // trad key allow the parser to generate an entry in the json file
    label: string // label must be used in components
    description: string
}

export function getUserProfile(profileObj: Profile[], slug: string): Profile | {} {
    return profileObj.find(p => slug === p.slug) ?? {}
}
