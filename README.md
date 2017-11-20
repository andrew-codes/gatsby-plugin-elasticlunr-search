# Search Plugin for Gatsby
This plugin enables search integration via elastic lunr. Content is indexed and then made available via graphql to rehydrate into an `elasticlunr` index. From there, queries can be made against this index to retrieve pages by their ID.

# Getting Started
Install the plugin via `npm install -D @andrew-codes/gatsby-plugin-elasticlunr-search`. Next, update your `gatsby-config.js` file to utilize the plugin.


## Setup in `gatsby-config`
```javascript
module.exports = {
    plugins: [
        {
            resolve: `@andrew-codes/gatsby-plugin-elasticlunr-search`,
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
import React, {Component} from 'React';
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
                <input type="text" value={this.state.query} onChange={search}/>
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
                .map(this.index.documentStore.getDoc),
        });
    }
}
```
