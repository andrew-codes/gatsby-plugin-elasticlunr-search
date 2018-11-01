module.exports = {
  siteMetadata: {
    title: `gatsby-plugin-elasticlunr-search example site`,
  },
  pathPrefix: `/gatsby-plugin-elasticlunr-search`,
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/pages`,
        name: `pages`,
      },
    },
    `gatsby-transformer-remark`,
    {
      resolve: `@gatsby-contrib/gatsby-plugin-elasticlunr-search`,
      options: {
        // Fields to index
        fields: [`title`, `tags`],
        // How to resolve each field`s value for a supported node type
        resolvers: {
          // For any node of type MarkdownRemark, list how to resolve the fields` values
          MarkdownRemark: {
            title: node => node.frontmatter.title,
            path: node => node.frontmatter.path,
            tags: node => node.frontmatter.tags,
          },
        },
      },
    },
  ],
}
