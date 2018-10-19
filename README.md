<!--
[![Maintainability](https://api.codeclimate.com/v1/badges/124348de2ee6850d682f/maintainability)](https://codeclimate.com/github/andrew-codes/gatsby-plugin-elasticlunr-search/maintainability)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/7230ae7191f44a9489834553760310c2)](https://www.codacy.com/app/andrew-codes/gatsby-plugin-elasticlunr-search?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=andrew-codes/gatsby-plugin-elasticlunr-search&amp;utm_campaign=Badge_Grade)

-->

# Search Plugin for Gatsby

This plugin enables search integration via elastic lunr. Content is indexed and then made available via graphql to rehydrate into an `elasticlunr` index. From there, queries can be made against this index to retrieve pages by their ID.

It is a fork of [gatsby-plugin-elasticlunr-search](https://github.com/andrew-codes/gatsby-plugin-elasticlunr-search) made in order to use the plugin with gatsby-v2.

# Getting Started

Install the plugin via `npm install -D @gatsby-contrib/gatsby-plugin-elasticlunr-search`.

<!--
See the [demo site repo](https://github.com/andrew-codes/gatsby-plugin-elasticlunr-search-demo) for more specific implementation details. -->

Next, update your `gatsby-config.js` file to utilize the plugin.

## Setup in `gatsby-config`

```javascript
module.exports = {
    plugins: [
        {
            resolve: `@gatsby-contrib/gatsby-plugin-elasticlunr-search`,
            options: {
                // Fields to index
                fields: [
                    'title',
                    'keywords',
                ],
                // How to resolve each field's value for a supported node type
                resolvers: {
                    // For any node of type MarkdownRemark, list how to resolve the fields' values
                    MarkdownRemark: {
                        title: node => node.frontmatter.title,
                        keywords: node => node.frontmatter.keywords,
                    },
                },
            },
        },
    ],
};
```

## Consuming in Your Site

The serialized search index will be available via graphql. Once queried, a component can create a new elastic lunr index with the value retrieved from the graphql query. Search queries can be made against the hydrated search index. The results is an array of document IDs. The index can return the full document given a document ID

```javascript
import React, {Component} from 'react';
import {Index} from 'elasticlunr';

// Graphql query used to retrieve the serialized search index.
export const query = graphql`query
SearchIndexExampleQuery {
    siteSearchIndex {
      index
    }
}`;

// Search component
export default class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            query: ``,
            results: [],
        };
    }

    render() {
        return (
            <div>
                <input type="text" value={this.state.query} onChange={this.search}/>
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

    getOrCreateIndex = () => this.index
        ? this.index
        // Create an elastic lunr index and hydrate with graphql query results
        : Index.load(this.props.data.siteSearchIndex.index);

    search = (evt) => {
        const query = evt.target.value;
        this.index = this.getOrCreateIndex();
        this.setState({
            query,
            // Query the index with search string to get an [] of IDs
            results: this.index.search(query)
                // Map over each ID and return the full document
                .map(({
                ref,
                }) => this.index.documentStore.getDoc(ref)),
        });
    }
}
```
