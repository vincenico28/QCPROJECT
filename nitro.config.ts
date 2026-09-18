export default {
  preset: process.env.NITRO_PRESET || "node-server",
  handlers: [
    {
      route: "/**",
      handler: "./dist/server/server.js"
    }
  ],
  publicAssets: [
    {
      baseURL: "/",
      dir: "./dist/client"
    }
  ]
}
