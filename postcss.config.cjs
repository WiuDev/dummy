// PostCSS do Mantine, como no guia de Vite da documentação: o preset traz
// rem(), light-dark() e os mixins (hover, smaller-than…), e o simple-vars
// define os breakpoints do tema para usar nos CSS Modules.
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
}
