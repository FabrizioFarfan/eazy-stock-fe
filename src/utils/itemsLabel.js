// «1 item» / «5 items»: la etiqueta de cuántos productos lleva una venta.
export const itemsLabel = (t, n) => (Number(n) === 1 ? t('1 item') : t('{n} items', { n }))
