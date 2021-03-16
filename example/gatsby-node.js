const path = require(`path`)

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions

  return new Promise((resolve, reject) => {
    const blogPostTemplate = path.resolve(`src/templates/md.js`)
    graphql(`
      {
        allMarkdownRemark(
          sort: { order: DESC, fields: [frontmatter___path] }
          limit: 1000
        ) {
          edges {
            node {
              frontmatter {
                path
              }
            }
          }
        }
      }
    `).then(result => {
      if (result.errors) {
        reject(result.errors)
      }

      // Create blog posts pages.
      result.data.allMarkdownRemark.edges.forEach(({ node }) => {
        createPage({
          path: node.frontmatter.path, // required
          component: blogPostTemplate,
          context: {},
        })
      })

      resolve()
    })
  })
}
