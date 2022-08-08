from flask import Flask, render_template, request, redirect, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from werkzeug.utils import secure_filename
from datetime import datetime
from hashlib import sha3_256
from secrets import token_urlsafe
from os import path, environ

app = Flask(__name__)

app.config['DEBUG'] = False                 
app.config['SECRET_KEY'] = environ.get('STORE_SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///db.sqlite3"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_IMAGE'] = 'static/images'

db = SQLAlchemy(app)


class OrderProducts(db.Model):
    order_id = db.Column(db.ForeignKey('order.id', ondelete='CASCADE'), primary_key=True)
    product_id = db.Column(db.ForeignKey('product.id', ondelete='CASCADE'), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)
    product = db.relationship("Product")


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    image = db.Column(db.String(250), unique=True, nullable=False)
    name = db.Column(db.String(250), unique=True, nullable=False)
    products = db.relationship('Product', backref='products')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id', ondelete='CASCADE'), nullable=False)
    image = db.Column(db.String(250), unique=True, nullable=False)
    name = db.Column(db.String(250), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    category = db.relationship("Category", back_populates="products")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(13), nullable=False)
    products = db.relationship('OrderProducts')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(13), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    token = db.Column(db.String(250), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


ma = Marshmallow(app)


class OrderProductsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = OrderProducts
        include_fk = True


class CategorySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Category


class ProductSchema(ma.SQLAlchemyAutoSchema):
    category = ma.Nested(CategorySchema)

    class Meta:
        model = Product
        include_fk = True


class OrderSchema(ma.SQLAlchemyAutoSchema):
    products = ma.Nested(OrderProductsSchema, many=True)

    class Meta:
        model = Order
        include_fk = True
        

@app.route('/', methods=['GET', 'POST'])
def index():
    data = {}
    if request.method == 'POST':
        order = Order(
            first_name=request.json.get('first_name'),
            last_name=request.json.get('last_name'),
            address=request.json.get('address'),
            city=request.json.get('city'),
            phone=request.json.get('phone')
        )
        db.session.add(order)
        db.session.commit()
        for order_product in request.json.get('cart'):
            order_product = OrderProducts(
                order_id=order.id,
                product_id=order_product['id'],
                quantity=order_product['quantity']
            )
            db.session.add(order_product)
            db.session.commit()
        return jsonify({'order_id' : order.id})
    data['categories'] = Category.query.all()
    data['products'] = Product.query.all()
    return render_template('index.html', data=data)


@app.route('/admin/', methods=['GET'])
def admin():    
    return render_template('admin.html')


@app.route('/admin/login/', methods=['POST'])
def admin_login():
    phone = request.json.get('phone')
    admin = Admin.query.filter_by(phone=phone).first()
    if admin is not None:
        if admin.password == sha3_256(request.json.get('password').encode('utf-8')).hexdigest():
            token = token_urlsafe()
            admin.token = token 
            db.session.commit()
            return jsonify({'token': token})
    return jsonify({'token' : ''})


@app.route('/admin/upload/', methods=['POST'])
def admin_upload():
    image = request.files.get('image')
    model = request.form.get('model')       
    image.save(path.join(app.config['UPLOAD_IMAGE'], model, image.filename))    
    return jsonify({'image': f'/static/images/{model}/{image.filename}'})


@app.route('/admin/data/', methods=['GET', 'POST', 'PUT', 'DELETE'])
def admin_data():
    if request.is_json:
        token = request.json.get('token')
    else:
        token = request.args.get('token')
    admin = Admin.query.filter_by(token=token).first()
    if admin is None:
        return jsonify({})
    if request.method == 'GET':
        category_schema = CategorySchema(many=True)
        product_schema = ProductSchema(many=True)
        order_schema = OrderSchema(many=True)
        data = {
            'categories': category_schema.dump(Category.query.all()),
            'products': product_schema.dump(Product.query.all()),
            'orders': order_schema.dump(Order.query.all())
        }
        return jsonify(data)
    elif request.method == 'POST':
        model = request.json.get('model')
        if model == 'categories':
            image = request.json.get('image')
            name = request.json.get('name')
            category = Category(
                image=image,
                name=name
            )
            db.session.add(category)
        elif model == 'products':
            category = request.json.get('category')
            image = request.json.get('image')
            name = request.json.get('name')
            description = request.json.get('description')
            price = request.json.get('price')
            quantity = request.json.get('quantity')
            category = Category.query.filter_by(name=category).first()
            product = Product(
                category_id=category.id,
                image=image,
                name=name,
                description=description,
                price=price,
                quantity=quantity
            )
            db.session.add(product)
        db.session.commit()
        return jsonify({})
    elif request.method == 'PUT':
        model = request.json.get('model')
        id = request.json.get('id')
        if model == 'categories':
            category = Category.query.filter_by(id=id).first()
            category.image = request.json.get('image', category.image)
            category.name = request.json.get('name', category.name)
        elif model == 'products':
            product = Product.query.filter_by(id=id).first()
            if request.json.get('category') is not None:
                category = Category.query.filter_by(name=request.json.get('category')).first()
                product.category_id = category.id
            product.image = request.json.get('image', product.image)
            product.name = request.json.get('name', product.name)
            product.description = request.json.get('description', product.description)
            product.price = request.json.get('price', product.price)
            product.quantity = request.json.get('quantity', product.quantity)
        db.session.commit()
        return jsonify({})        
    elif request.method == 'DELETE':
        model = request.json.get('model')
        id = request.json.get('id')
        if model == 'categories':
            category = Category.query.filter_by(id=id).first()
            db.session.delete(category)
        elif model == 'products':
            product = Product.query.filter_by(id=id).first()
            db.session.delete(product)
        elif model == 'orders':
            order = Order.query.filter_by(id=id).first()
            db.session.delete(order)
        db.session.commit()
        return jsonify({})


@app.route('/service_worker.js')
def service_worker():
    return send_file('service_worker.js', mimetype="text/javascript")


@app.route('/manifest.json')
def manifest():
    return send_file('manifest.json', mimetype="application/json")


if __name__ == '__main__':
    app.run()
