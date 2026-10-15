import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    stock: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

const products = [
    {
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise cancelling headphones with 30-hour battery life, crystal clear hands-free calling, and Alexa voice control.',
        price: 24999,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        stock: 25
    },
    {
        name: 'Apple iPhone 15 Pro',
        description: 'Titanium design. A17 Pro chip. 48MP main camera system with 5x telephoto. USB-C with USB 3 speeds.',
        price: 134900,
        category: 'Smartphones',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
        stock: 15
    },
    {
        name: 'Nike Air Max 270',
        description: 'Lightweight, breathable mesh upper with Max Air unit in the heel for all-day comfort. Perfect for running and casual wear.',
        price: 10995,
        category: 'Footwear',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        stock: 40
    },
    {
        name: 'MacBook Air M3',
        description: '15-inch Liquid Retina display, M3 chip, 18-hour battery, 8GB RAM, 256GB SSD. Fanless and silent performance.',
        price: 114900,
        category: 'Laptops',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        stock: 10
    },
    {
        name: 'Levi\'s 501 Original Jeans',
        description: 'The original straight fit jeans. Button fly, 5-pocket styling, and iconic Levi\'s quality since 1873.',
        price: 3499,
        category: 'Clothing',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80',
        stock: 60
    },
    {
        name: 'Instant Pot Duo 7-in-1',
        description: 'Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer all in one. 6-quart capacity.',
        price: 8499,
        category: 'Kitchen',
        image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&auto=format&fit=crop&q=80',
        stock: 30
    },
    {
        name: 'Samsung Galaxy Tab S9',
        description: '11-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 2, IP68 water resistant, S Pen included.',
        price: 72999,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
        stock: 18
    },
    {
        name: 'Fjällräven Kånken Backpack',
        description: 'Iconic Swedish backpack with padded shoulder straps, large main compartment, and durable Vinylon F fabric.',
        price: 6999,
        category: 'Bags',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        stock: 50
    },
    {
        name: 'Dyson V15 Detect Vacuum',
        description: 'Laser illumination reveals hidden dust. HEPA filtration captures 99.97% of particles. 60 min run time.',
        price: 52900,
        category: 'Home Appliances',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80',
        stock: 0
    },
    {
        name: 'Fossil Gen 6 Smartwatch',
        description: 'Wear OS by Google. AMOLED display, SpO2 sensor, GPS, heart rate monitor, and 24+ app compatibility.',
        price: 22995,
        category: 'Wearables',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        stock: 35
    },
    {
        name: 'Kindle Paperwhite (2023)',
        description: '6.8-inch display, adjustable warm light, 16GB storage, IPX8 waterproof, weeks of battery life.',
        price: 14999,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=800&auto=format&fit=crop&q=80',
        stock: 45
    },
    {
        name: 'Adidas Ultraboost 23',
        description: 'BOOST midsole delivers incredible energy return. Primeknit+ upper fits like a sock. Continental rubber outsole.',
        price: 16999,
        category: 'Footwear',
        image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
        stock: 22
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.dbURL, { tlsAllowInvalidCertificates: true });
        console.log('✅ Connected to MongoDB');

        const existing = await Product.countDocuments();
        if (existing > 0) {
            console.log(`⚠️  Found ${existing} existing products. Deleting them first...`);
            await Product.deleteMany({});
        }

        const inserted = await Product.insertMany(products);
        console.log(`🎉 Successfully seeded ${inserted.length} products!`);
        inserted.forEach(p => console.log(`   • ${p.name} (${p.category}) — ₹${p.price}`));
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

seed();
