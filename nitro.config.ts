export default {
  preset: "vercel",
  handlers: [
    {
      route: "/**",
      handler: "./dist/server/server.js"
    }
  ]
}
