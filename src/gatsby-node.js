const crypto = require(`crypto`)
const { GraphQLScalarType } = require(`gatsby/graphql`)
const elasticlunr = require(`elasticlunr`)

const SEARCH_INDEX_ID = `SearchIndex < Site`
const SEARCH_INDEX_TYPE = `SiteSearchIndex`
const parent = `___SOURCE___`

const md5 = src =>
  crypto
    .createHash(`md5`)
    .update(src)
    .digest(`hex`)

const createEmptySearchIndexNode = () => {
  return {
    id: SEARCH_INDEX_ID,
    parent,
    children: [],
    pages: [],
  }
}

const appendPage = ({ pages }, newPage) => {
  const newPages = [...pages, newPage]
  const content = JSON.stringify(newPage)
  return {
    id: SEARCH_INDEX_ID,
    parent,
    children: [],
    pages: newPages,
    internal: {
      type: SEARCH_INDEX_TYPE,
      content: content,
      contentDigest: md5(content),
    },
  }
}

const createOrGetIndex = async (
  node,
  cache,
  getNode,
  server,
  { fields, resolvers }
) => {
  const cacheKey = `${node.id}:index`
  const cached = await cache.get(cacheKey)
  if (cached) {
    return cached
  }

  const index = elasticlunr()
  index.setRef(`id`)
  fields.forEach(field => index.addField(field))

  for (const pageId of node.pages) {
    const pageNode = getNode(pageId)

    const fieldResolvers = resolvers[pageNode.internal.type]
    if (fieldResolvers) {
      const doc = {
        id: pageNode.id,
        date: pageNode.date,
        ...Object.keys(fieldResolvers).reduce((prev, key) => {
          return {
            ...prev,
            [key]: fieldResolvers[key](pageNode),
          }
        }, {}),
      }

      index.addDoc(doc)
    }
  }

  const json = index.toJSON()
  await cache.set(cacheKey, json)
  return json
}

const SearchIndex = new GraphQLScalarType({
  name: `${SEARCH_INDEX_TYPE}_Index`,
  description: `Serialized elasticlunr search index`,
  parseValue() {
    throw new Error(`Not supported`)
  },
  serialize(value) {
    return value
  },
  parseLiteral() {
    throw new Error(`Not supported`)
  },
})

exports.sourceNodes = async ({ getNodes, actions }) => {
  const { touchNode } = actions

  const existingNodes = getNodes().filter(
    n => n.internal.owner === `@gatsby-contrib/gatsby-plugin-elasticlunr-search`
  )
  existingNodes.forEach(n => touchNode({ nodeId: n.id }))
}

exports.onCreateNode = ({ node, actions, getNode }, { resolvers }) => {
  if (Object.keys(resolvers).indexOf(node.internal.type) === -1) {
    return
  }

  const { createNode } = actions
  const searchIndex = getNode(SEARCH_INDEX_ID) || createEmptySearchIndexNode()
  const newSearchIndex = appendPage(searchIndex, node.id)
  createNode(newSearchIndex)
}

exports.setFieldsOnGraphQLNodeType = (
  { type, getNode, cache },
  pluginOptions
) => {
  if (type.name !== SEARCH_INDEX_TYPE) {
    return null
  }

  return {
    index: {
      type: SearchIndex,
      resolve: (node, _opts, _3, server) =>
        createOrGetIndex(node, cache, getNode, server, pluginOptions),
    },
  }
}
