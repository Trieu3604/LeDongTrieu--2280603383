var express = require('express');
var router = express.Router();
const slugify = require('slugify');

let productModel = require('../schemas/products');
let { verifyToken } = require('../utils/authHandler');


// ===================== GET ALL =====================
router.get('/', async function (req, res) {
  try {
    let queries = req.query;

    let titleQ = queries.title ? queries.title : "";
    let minPrice = queries.min ? queries.min : 0;
    let maxPrice = queries.max ? queries.max : 10000;

    let result = await productModel.find({
      isDeleted: false,
      title: new RegExp(titleQ, 'i'),
      price: {
        $gte: minPrice,
        $lte: maxPrice
      }
    }).populate({
      path: 'category',
      select: "name"
    });

    res.send(result);

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});


// ===================== GET BY ID =====================
router.get('/:id', async function (req, res) {
  try {
    let result = await productModel.findById(req.params.id);

    if (!result || result.isDeleted) {
      return res.status(404).send({ message: "ID NOT FOUND" });
    }

    res.send(result);

  } catch (error) {
    res.status(404).send({ message: "ID NOT FOUND" });
  }
});


// ===================== CREATE =====================
router.post('/', verifyToken, async function (req, res) {
  try {
    let newProduct = new productModel({
      title: req.body.title,
      slug: slugify(req.body.title, { lower: true }),
      price: req.body.price,
      description: req.body.description,
      images: req.body.images,
      category: req.body.category
    });

    await newProduct.save();

    res.send(newProduct);

  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});


// ===================== UPDATE =====================
router.put('/:id', verifyToken, async function (req, res) {
  try {
    let result = await productModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!result) {
      return res.status(404).send({ message: "ID NOT FOUND" });
    }

    res.send(result);

  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});


// ===================== DELETE =====================
router.delete('/:id', verifyToken, async function (req, res) {
  try {
    let result = await productModel.findById(req.params.id);

    if (!result || result.isDeleted) {
      return res.status(404).send({ message: "ID NOT FOUND" });
    }

    result.isDeleted = true;
    await result.save();

    res.send(result);

  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});


module.exports = router;