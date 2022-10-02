export const suffle = (data) =>
  data
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)

export const rand = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

export const saveToLS = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const loadFromLS = (key) => {
  let data = []
  const lsData = localStorage.getItem(key)
  if (lsData !== null) {
    data = JSON.parse(lsData)
  }
  return data
}
