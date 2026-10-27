const { defineConfig } = require('@vue/cli-service')

// publicPath relativo: el demo funciona abriendo dist/index.html o sirviéndolo
// desde cualquier subcarpeta del portfolio (por ejemplo /demos/nutricion/).
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  productionSourceMap: false,
  // Puerto distinto al de la app real (8080) para poder correr ambas a la vez.
  devServer: {
    port: 8081
  }
})
