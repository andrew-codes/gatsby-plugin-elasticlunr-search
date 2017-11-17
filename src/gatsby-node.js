const crypto = require('crypto');
const {GraphQLScalarType} = require('graphql');
const elasticlunr = require('elasticlunr');

const SEARCH_INDEX_ID = `SearchIndex < Site`;
const SEARCH_INDEX_TYPE = `SiteSearchIndex`;
const parent = `___SOURCE___`;

const md5 = src => crypto.createHash(`md5`).update(src).digest(`hex`);

const createEmptySearchIndexNode = () => ({
    id: SEARCH_INDEX_ID,
    parent,
    children: [],
    pages: [],
});

const appendPage = ({
                        pages,
                    }, newPage) => {
    const newPages = [
        ...pages,
        newPage
    ];
    const content = JSON.stringify(newPage);
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
    };
};

const createOrGetIndex = async (node, cache, getNode, server, {
    bodyIsSearchable,
    frontmatterSearchFields
}) => {
    const cacheKey = `${node.id}:index`;
    const cached = await cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const index = elasticlunr();
    index.addField('title');
    frontmatterSearchFields.forEach(index.addField);
    if (bodyIsSearchable) {
        index.addField('body');
    }
    index.setRef('id');

    for (const pageId of node.pages) {
        const page = getNode(pageId);
        const doc = {
            id: page.id,
            title: page.frontmatter.title,
            date: page.date,
            ...(bodyIsSearchable ? {
                body: page.content,
            } : {}),
            ...frontmatterSearchFields.reduce((prev, field) => ({
                ...prev,
                [field]: page.frontmatter[field],
            }), {}),
        };

        index.addDoc(doc);
    }

    const json = index.toJSON();
    await cache.set(cacheKey, json);
    return json;
};

const SearchIndex = new GraphQLScalarType({
    name: `${SEARCH_INDEX_TYPE}_Index`,
    description: 'Serialized elasticlunr search index',
    parseValue() {
        throw new Error('Not supported');
    },
    serialize(value) {
        return value;
    },
    parseLiteral() {
        throw new Error('Not supported');
    },
});

exports.onCreateNode = ({
                            node,
                            boundActionCreators,
                            getNode,
                        }) => {
    const {createNode} = boundActionCreators;
    if (node.internal.type === `MarkdownRemark`) {
        const searchIndex = getNode(SEARCH_INDEX_ID) || createEmptySearchIndexNode();
        const newSearchIndex = appendPage(searchIndex, node.id);
        createNode(newSearchIndex);
    }
};

exports.setFieldsOnGraphQLNodeType = ({
                                          type,
                                          getNode,
                                          cache
                                      }, {
                                          bodyIsSearchable,
                                          frontmatterSearchFields,
                                      }) => {
    if (type.name !== SEARCH_INDEX_TYPE) {
        return null;
    }

    return {
        index: {
            type: SearchIndex,
            resolve: (node, _opts, _3, server) =>
                createOrGetIndex(node, cache, getNode, server, {
                    bodyIsSearchable: false,
                    frontmatterSearchFields: [],
                })
        },
    };
};
