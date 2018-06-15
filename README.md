[![Maintainability](https://api.codeclimate.com/v1/badges/124348de2ee6850d682f/maintainability)](https://codeclimate.com/github/andrew-codes/gatsby-plugin-elasticlunr-search/maintainability)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/7230ae7191f44a9489834553760310c2)](https://www.codacy.com/app/andrew-codes/gatsby-plugin-elasticlunr-search?utm_source=github.com&utm_medium=referral&utm_content=andrew-codes/gatsby-plugin-elasticlunr-search&utm_campaign=Badge_Grade)

# Search Plugin for Gatsby

This plugin enables search integration via elastic lunr. Content is indexed and then made available via graphql to rehydrate into an `elasticlunr` index. From there, queries can be made against this index to retrieve pages by their ID.

# Getting Started

Install the plugin via `npm install -D @andrew-codes/gatsby-plugin-elasticlunr-search`. See the [demo site repo](https://github.com/andrew-codes/gatsby-plugin-elasticlunr-search-demo) for more specific implementation details.

Next, update your `gatsby-config.js` file to utilize the plugin.

## Usage

In order to add documents to the search index, you will need to inform the plugin which types of documents are relevant to your search needs. If you are unsure of the exact type, open gatsby's graphiql endpoint via a web browser of the graphiql app. Search the docs explorer for you schema, then perform a query on it like so:

```
query GetTypeQuery {
    wordpress__POST {
        internal {
            type
        }
    }
}
```

The output of type is what you will use in your resolver as demonstrated below.

### Basic Example

```javascript
// gatsby-config.js
module.exports = {
    plugins: [
        {
            resolve: `@andrew-codes/gatsby-plugin-elasticlunr-search`,
            options: {
                // Fields to index
                fields: ['title', 'keywords'],
                // How to resolve each field's value for a supported node type
                resolvers: {
                    // For any node of type MarkdownRemark, list how to resolve the fields' values
                    MarkdownRemark: {
                        title: node => node.frontmatter.title,
                        keywords: node => node.frontmatter.keywords
                    }
                }
            }
        }
    ]
};
```

### Resolve relational Data

Some data sources store necesary fields in foreign nodes. One example of this is WordPress. It store categories, tags, authors, and posts in separate DB tables/rows. Gatsby handles stitching these together for you. However, at this stage of the build, it only has the ID of the node it relates to. In order to add the data from the related node, we will need to resolve it ourselves. Below is an example of adding the author name to the document in the search index for a wordpress poet.

```javascript
// gatsby-config.js
module.exports = {
    plugins: [
        {
            resolve: `@andrew-codes/gatsby-plugin-elasticlunr-search`,
            options: {
                // Fields to index
                fields: ['title', 'author'],
                // How to resolve each field's value for a supported node type
                resolvers: {
                    // For any node of type wordpress__POST, list how to resolve the fields' values
                    wordpress__POST: {
                        title: node => node.title,
                        author: (node, getNode) =>
                            getNode(node.author___NODE).name
                    }
                }
            }
        }
    ]
};
```

### Filter nodes that are added to the index

gatsby-plugin-elasticlunr-search allows you to filter the nodes that go in to the index to avoid unnecessary memory usage.

```javascript
// gatsby-config.js
module.exports = {
    plugins: [
        {
            resolve: `@andrew-codes/gatsby-plugin-elasticlunr-search`,
            options: {
                // Fields to index
                fields: ['title', 'keywords'],
                // How to resolve each field's value for a supported node type
                resolvers: {
                    // For any node of type MarkdownRemark, list how to resolve the fields' values
                    MarkdownRemark: {
                        title: node => node.frontmatter.title,
                        keywords: node => node.frontmatter.keywords
                    }
                },
                filter: (node, getNode) => node.post_type !== 'page'
            }
        }
    ]
};
```

### Filter nodes that are added to the index, based on props of another node

```javascript
// gatsby-config.js
module.exports = {
    plugins: [
        {
            resolve: `@andrew-codes/gatsby-plugin-elasticlunr-search`,
            options: {
                // Fields to index
                fields: ['title', 'keywords'],
                // How to resolve each field's value for a supported node type
                resolvers: {
                    // For any node of type MarkdownRemark, list how to resolve the fields' values
                    MarkdownRemark: {
                        title: node => node.frontmatter.title,
                        keywords: node => node.frontmatter.keywords
                    }
                },
                filter: (node, getNode) => {
                    const categoryIds = node.category___NODE;
                    const categoryNames = categoryIds.map(
                        id => getNode(id).name
                    );

                    return !categorynames.includes('no-search');
                }
            }
        }
    ]
};
```

## Consuming in Your Site

The serialized search index will be available via graphql. Once queried, a component can create a new elastic lunr index with the value retrieved from the graphql query. Search queries can be made against the hydrated search index. The results is an array of document IDs. The index can return the full document given a document ID

```javascript
import React, { Component } from 'react';
import { Index } from 'elasticlunr';

// Graphql query used to retrieve the serialized search index.
export const query = graphql`
    query SearchIndexExampleQuery {
        siteSearchIndex {
            index
        }
    }
`;

// Search component
export default class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            query: ``,
            results: []
        };
    }

    render() {
        return (
            <div>
                <input
                    type="text"
                    value={this.state.query}
                    onChange={this.search}
                />
                <ul>
                    {this.state.results.map(page => (
                        <li>
                            {page.title}: {page.keywords.join(`,`)}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    getOrCreateIndex = () =>
        this.index
            ? this.index
            : // Create an elastic lunr index and hydrate with graphql query results
              Index.load(this.props.data.siteSearchIndex.index);

    search = evt => {
        const query = evt.target.value;
        this.index = this.getOrCreateIndex();
        this.setState({
            query,
            // Query the index with search string to get an [] of IDs
            results: this.index
                .search(query)
                // Map over each ID and return the full document
                .map(({ ref }) => this.index.documentStore.getDoc(ref))
        });
    };
}
```
