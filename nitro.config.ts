export default {
  preset: "vercel",
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
