export default {
  plugins: [
    [
      "babel-plugin-styled-components",
      {
        "displayName": true,
        "fileName": false,
        "ssr": true,
        "pure": true
      }
    ],
    // Removed babel-plugin-import for antd - antd v6 has native tree-shaking
    // and the plugin breaks sub-component access like Input.TextArea
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-syntax-dynamic-import"
  ],
  presets: [
    "@babel/preset-env",
    "@babel/preset-react"
  ]
}
