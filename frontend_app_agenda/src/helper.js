export const getUserProfile = (profileObj, slug) => Object.keys(profileObj).map(p => profileObj[p]).find(p => slug === p.slug) || {}
