const UA_PREFIXES: [string, string][] = [
  ['ПУБЛІЧНЕ АКЦІОНЕРНЕ ТОВАРИСТВО',                'ПАТ'],
  ['ПРИВАТНЕ АКЦІОНЕРНЕ ТОВАРИСТВО',                'ПРАТ'],
  ['КОМУНАЛЬНЕ НЕКОМЕРЦІЙНЕ ПІДПРИЄМСТВО',          'КНП'],
  ['КОМУНАЛЬНЕ ПІДПРИЄМСТВО',                        'КП'],
  ['ДЕРЖАВНЕ ПІДПРИЄМСТВО',                          'ДП'],
  ['ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ',       'ТОВ'],
  ['ФІЗИЧНА ОСОБА - ПІДПРИЄМЕЦЬ',                   'ФОП'],
  ['ФІЗИЧНА ОСОБА-ПІДПРИЄМЕЦЬ',                     'ФОП'],
  ['ПРИВАТНЕ ПІДПРИЄМСТВО',                          'ПП'],
  ['АКЦІОНЕРНЕ ТОВАРИСТВО',                          'АТ'],
  ['ВИРОБНИЧИЙ КООПЕРАТИВ',                          'ВК'],
]

export function abbreviateUaName(name: string): string {
  if (!name) return name
  const u = name.toUpperCase()
  for (const [prefix, abbr] of UA_PREFIXES) {
    if (u.startsWith(prefix)) {
      const rest = name.slice(prefix.length).trimStart()
      return rest ? `${abbr} ${rest}` : abbr
    }
  }
  return name
}
