const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Set the entry point to our VSCode-specific index file
      webpackConfig.entry = path.resolve(__dirname, "src/vscode/index.tsx");

      // Set the output directory
      webpackConfig.output.path = path.resolve(__dirname, "build-vscode");
      webpackConfig.output.publicPath = "./media/build-vscode/";

      // Enable source maps for better debugging in VSCode extension
      webpackConfig.devtool = "source-map";

      // Configure HTML template for VSCode build
      const HtmlWebpackPlugin = require("html-webpack-plugin");
      const htmlPluginIndex = webpackConfig.plugins.findIndex(
        (plugin) => plugin instanceof HtmlWebpackPlugin
      );

      if (htmlPluginIndex !== -1) {
        webpackConfig.plugins[htmlPluginIndex] = new HtmlWebpackPlugin({
          template: path.resolve(__dirname, "src/vscode/index.html"),
          filename: "index.html",
          inject: true,
          minify: false, // Keep readable for VSCode debugging
        });
      }

      // Add aliases for VSCode proxies
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Use VSCode proxies when building for VSCode
        axios: path.resolve(__dirname, "src/vscode/axios-proxy.ts"),
        "axios-retry": path.resolve(
          __dirname,
          "src/vscode/axios-retry-proxy.ts"
        ),
        "react-router-dom": path.resolve(
          __dirname,
          "src/vscode/react-router-dom-proxy.ts"
        ),
      };

      return webpackConfig;
    },
  },
  // Override the paths for VSCode build
  paths: {
    appBuild: path.resolve(__dirname, "build-vscode"),
  },
};
