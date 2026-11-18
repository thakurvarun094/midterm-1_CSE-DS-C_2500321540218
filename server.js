
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const FILE = path.join(__dirname, "products.json");

// Create products.json if it doesn't exist
if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
}

// Read products
function getProducts() {
    const data = fs.readFileSync(FILE, "utf8");
    return JSON.parse(data);
}

// Save products
function saveProducts(products) {
    fs.writeFileSync(FILE, JSON.stringify(products, null, 2));
}

// Send response
function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(data));
}

// Create server
const server = http.createServer((req, res) => {

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", () => {

        try {

            let products = getProducts();

            // HOME ROUTE
            if (method === "GET" && pathname === "/") {

                return sendResponse(res, 200, {
                    message: "Welcome to Product Inventory Management System"
                });
            }

            // CREATE PRODUCT
            if (method === "POST" && pathname === "/products") {

                const newProduct = JSON.parse(body);

                newProduct.id = Date.now();

                products.push(newProduct);
                saveProducts(products);

                return sendResponse(res, 201, {
                    message: "Product added successfully",
                    product: newProduct
                });
            }

            // READ ALL PRODUCTS
            else if (method === "GET" && pathname === "/products") {

                return sendResponse(res, 200, products);
            }

            // READ SINGLE PRODUCT
            else if (method === "GET" && pathname.startsWith("/products/")) {

                const id = Number(pathname.split("/")[2]);

                const product = products.find(p => p.id === id);

                if (!product) {
                    return sendResponse(res, 404, {
                        message: "Product not found"
                    });
                }

                return sendResponse(res, 200, product);
            }

            // UPDATE PRODUCT
            else if (method === "PUT" && pathname.startsWith("/products/")) {

                const id = Number(pathname.split("/")[2]);

                const index = products.findIndex(p => p.id === id);

                if (index === -1) {
                    return sendResponse(res, 404, {
                        message: "Product not found"
                    });
                }

                const updatedData = JSON.parse(body);

                products[index] = {
                    ...products[index],
                    ...updatedData,
                    id: id
                };

                saveProducts(products);

                return sendResponse(res, 200, {
                    message: "Product updated successfully",
                    product: products[index]
                });
            }

            // DELETE PRODUCT
            else if (method === "DELETE" && pathname.startsWith("/products/")) {

                const id = Number(pathname.split("/")[2]);

                const index = products.findIndex(p => p.id === id);

                if (index === -1) {
                    return sendResponse(res, 404, {
                        message: "Product not found"
                    });
                }

                const deletedProduct = products.splice(index, 1);

                saveProducts(products);

                return sendResponse(res, 200, {
                    message: "Product deleted successfully",
                    product: deletedProduct[0]
                });
            }

            // INVALID ROUTE
            else {
                return sendResponse(res, 404, {
                    message: "Route not found"
                });
            }

        } catch (error) {

            return sendResponse(res, 400, {
                message: "Invalid request",
                error: error.message
            });

        }

    });

});

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
