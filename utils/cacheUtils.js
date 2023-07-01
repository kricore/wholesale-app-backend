const Product = require("../models/product");
const ShopifyApiEndpoint = require("../models/shopifyApiEndpoint");
const dotenv = require("dotenv");
dotenv.config();

class CacheUtils {
  constructor() {}

  /**
   * Get Endpoint from DB
   *
   * @param {string} reqEndpoint
   * @return {object|null}
   */
  getApiEndpoint = async (reqEndpoint) => {
    try {
      const endpoint = reqEndpoint.replace(
        "<shopifyApiVersion>",
        process.env.SHOPIFY_API_VERSION
      );
      const shopifyApiEndpoint = await ShopifyApiEndpoint.findOne({
        endpoint: endpoint,
      });

      return shopifyApiEndpoint;
    } catch (e) {
      this.handleError(e);
      return null;
    }
  };

  /**
   * Get product from DB
   *
   * @param {string} requestId
   * @return {object|null}
   */
  getCachedProduct = async (requestId) => {
    try {
      const product = await Product.findOne({ requestId: requestId });
      return product;
    } catch (e) {
      this.handleError(e);
      return null;
    }
  };

  /**
   * Check for any potential cached data before
   * making a request to SHopify's API
   *
   * @param {string} endpoint
   * @returns
   */
  preFetchHook = async (endpoint) => {
    const currentTimestamp = new Date().valueOf();
    const result = await this.getApiEndpoint(endpoint);

    if (
      !result ||
      result.lastTimestamp + Number(process.env.CACHE_TTL) < currentTimestamp
    ) {
      return false;
    }

    return (await this.getCachedProduct(result._id.toString())) ?? false;
  };

  /**
   * Saves the response to the MongoDB database
   * And adds a timestap for cache busting
   *
   * @param {string} endpoint
   * @param {array} products
   */
  postFetchHook = async (endpoint, productData) => {
    /**
     * Shopify endpoint data
     */
    const endpointData = {
      endpoint: endpoint.replace(
        "<shopifyApiVersion>",
        process.env.SHOPIFY_API_VERSION
      ),
      lastTimestamp: new Date().valueOf(),
    };

    /**
     * using upsert: creates / updates a document
     */
    const options = {
      upsert: true,
      returnDocument: true,
      new: true,
    };

    try {
      const shopifyApiEndpoint = await ShopifyApiEndpoint.findOneAndUpdate(
        { endpoint: endpointData.endpoint },
        endpointData,
        options
      );

      productData.requestId = shopifyApiEndpoint._id.toString();
      
      await Product.findOneAndUpdate(
        { id: productData.id },
        productData,
        options
      );
    } catch (e) {
      this.handleError(e);
    }
  };

  /**
   * @todo Error handling
   * @param {*} error
   */
  handleError(error) {
    console.log(error);
  }
}

module.exports = CacheUtils;
