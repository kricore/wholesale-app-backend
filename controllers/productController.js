const dotenv = require("dotenv");
const CacheUtils = require("../utils/cacheUtils");
const cacheUtils = new CacheUtils();
dotenv.config();

/**
 * Perform all calls to the shopify API
 *
 * @param {string} endpoint
 * @returns {json}
 */
const fetchFromShopify = async (endpoint) => {

  let url = [process.env.SHOPIFY_BASE_API, endpoint]
    .join("/")
    .replace("<shopifyApiVersion>", process.env.SHOPIFY_API_VERSION);

  const response = await fetch(url, {
    method: "GET", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  });

  let data = await response.json();

  return data;
};

/**
 * Get all products from public shopify api
 *
 * @param {*} req
 */
exports.handleProducts = async (req, res) => {
  const endpoint = process.env.SHOPIFY_PUBLIC_API_ENDPOINT;
  const data = await fetchFromShopify(endpoint);
  const products = data.products.map((prod) => normalizeProduct(prod));

  return res.json({ data: products });
};

/**
 * Get Product Price and Attributes.
 * If variants are > 1 use variant metafields endpoint, else product metafields endpoint
 * Price defaults to 0.00
 *
 * @param {object} product
 * @param {string} variantId
 * @returns {object}
 */
const getProductPriceAndAttibutes = async (product, variantId) => {
  const baseEndpoint =
        product.variants.length > 1
          ? process.env.SHOPIFY_PRODUCT_VARIANT_METAFIELDS_API_ENDPOINT
          : process.env.SHOPIFY_PRODUCT_METAFIELDS_API_ENDPOINT,

        endpoint = baseEndpoint
        .replace("<productId>", product.id)
        .replace("<variantId>", variantId);

  const data = await fetchFromShopify(endpoint);
  const metafields = data.metafields;
  const price = metafields.find((metafield) => metafield.key == "wsp") ?? {
    value: 0.0,
  };

  return {
    price: price.value,
    attributes: getProductAttributes(
      metafields.filter((metafield) => metafield.key != "wsp")
    ),
  };
};

/**
 * Get variant attributes
 *
 * @param {object} metafields
 * @return {object}
 */
const getProductAttributes = (metafields) => {
  const attributeLabels = {
    chainLength: "Chain Length",
    length: "Length",
    width: "Width",
    diameter: "Diameter",
    ringNumber: "Ring Number",
  };

  let variantAttirbutes = [];

  Object.keys(metafields).forEach((metafield) => {
    if (attributeLabels[metafields.key] !== undefined) {
      variantAttirbutes.push({
        label: attributeLabels[metafield.key],
        key: metafield.key,
        value: metafield.value,
      });
    }
  });

  return variantAttirbutes;
};

/**
 * Normalize data of product variants
 * Exclude variants that has't price
 *
 * @param {object} product
 * @return {object}
 */
const normalizeProductVariants = async (product) => {
  const defaultFeaturedImage = product.images?.['0']
    ? product.images['0'].src
    : null;

  for (let [index, variant] of product.variants.entries()) {

    let { price, attributes } = await getProductPriceAndAttibutes(
      product,
      variant.id
    );

    variant.price = Number( price );
    variant.attributes = attributes;
    variant.title =
      product.variants.length === 1
        ? product.title
        : product.title + " " + variant.title;

    variant.description = product.body_html;
    variant.featuredImage = variant.image_id
      ? product.images?.find((image) => image.id == variant.image_id).src
      : defaultFeaturedImage;
  }

  const availableVariants = product.variants.filter(
    (variant) => variant.price > 0
  );

  return availableVariants.map((variant) => {
    return {
      id: variant.id,
      title: variant.title,
      price: variant.price,
      attributes: variant.attributes,
      description: variant.description,
      featuredImage: variant.featuredImage,
    };
  });
};

/**
 * Normalize product data
 *
 * @param {object} product
 * @returns object
 */
const normalizeProduct = (product) => {
  return {
    id: product.id,
    title: product.title,
    description: product.body_html,
    variants: product.variants,
    featuredImage: product.images?.["0"] ? product.images["0"].src : null,
  };
};

/**
 * Retrieve the data for a single product.
 * If cached data exists, then retrieve these
 * 
 * @param {*} req
 * @param {*} res
 */
exports.handleProductById = async (req, res) => {
  const endpoint = process.env.SHOPIFY_PRODUCT_API_ENDPOINT.replace(
    "<productId>",
    req.params.id
  );

  const prefetchedData = await cacheUtils.preFetchHook(endpoint);

  /**
   * Check for cached data from DB
   */
  if(!!prefetchedData){
    return res.json({ data: prefetchedData });
  }

  const data = await fetchFromShopify(endpoint);
  const product = data.product;
  product.variants = await normalizeProductVariants(product);

  /**
   * Set data to be cached on DB
   */
  if( product.variants.lenth ){
    await cacheUtils.postFetchHook(endpoint, product);
  }

  return res.json({ data: normalizeProduct( product ) });
};


