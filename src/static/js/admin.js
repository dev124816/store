var products = [];
var categories = [];

function login() {
    let phone = $('#phone').val();
    let password = $('#password').val();

    if (
        phone !== ''
        && password !== ''
    ) {
        $.ajax({
            type: 'POST',
            url: 'http://localhost:5000/admin/login/',
            data: JSON.stringify({
                phone: phone,
                password: password
            }),
            contentType: 'application/json',
            success: (data) => {
                if (data.token === '') {
                    document.location.reload();
                }

                $('#token').val(data.token);

                $('#modal-container-1').removeClass('d-flex');
                $('#modal-container-1').addClass('d-none');

                $('.login-form').trigger('reset');
                
                getData();
            }
        });
    }
}

function getData() {
    var token = $('#token').val();

    $.ajax({
        type: 'GET',
        url: 'http://localhost:5000/admin/data/?token=' + token,
        success: (data) => {
            $('.orders').empty();
            $('.products').empty();
            $('.categories').empty();
            
            data.orders.forEach((order) => {
                order.products.forEach((orderProduct) => {
                    product = data.products.filter((product) => product.id === orderProduct.product_id)[0];
                    orderProduct.name = product.name;
                    order.created_at = order.created_at.replace('T', ' ').substring(0, order.created_at.indexOf('.'));
                    $('.orders').append(`
                        <tr>
                            <td class="id">${order.id}</td>
                            <td>${orderProduct.name}</td>
                            <td>${orderProduct.quantity}</td>
                            <td>${order.first_name}</td>
                            <td>${order.last_name}</td>
                            <td>${order.address}</td>
                            <td>${order.city}</td>
                            <td>${order.phone}</td>
                            <td>${order.created_at}</td>
                            <td><i class="material-icons text-danger pointer delete-icon" onClick="deleteData('orders', ${order.id})">delete</i></td>
                        </tr>
                    `);
                });
            });
            data.products.forEach((product) => {
                product.created_at = product.created_at.replace('T', ' ').substring(0, product.created_at.indexOf('.'));
                $('.products').append(`
                    <tr>
                        <td class="id">${product.id}</td>
                        <td>
                            <img class="table-image" src="${product.image}" />
                        </td>
                        <td>${product.name}</td>
                        <td>${product.description}</td>
                        <td>${product.price}</td>
                        <td>${product.quantity}</td>
                        <td>${product.category.name}</td>
                        <td>${product.created_at}</td>
                        <td><i class="material-icons text-warning pointer edit-icon" onClick="putData('products', ${product.id})">edit</i></td>
                        <td><i class="material-icons text-danger pointer delete-icon" onClick="deleteData('products', ${product.id})">delete</i></td>
                    </tr>
                `);
            });
            data.categories.forEach((category) => {
                category.created_at = category.created_at.replace('T', ' ').substring(0, category.created_at.indexOf('.'));
                $('.categories').append(`
                    <tr>
                        <td class="id">${category.id}</td>
                        <td>
                            <img class="table-image" src="${category.image}" />
                        </td>
                        <td>${category.name}</td>
                        <td>${category.created_at}</td>
                        <td><i class="material-icons text-warning pointer edit-icon" onClick="putData('categories', ${category.id})">edit</i></td>
                        <td><i class="material-icons text-danger pointer delete-icon" onClick="deleteData('categories', ${category.id})">delete</i></td>
                    </tr>
                `);
            });

            products = data.products;
            categories = data.categories;
        }
    });
}

function postData(model) {
    var token = $('#token').val();

    switch (model) {
        case 'products':
            $('.data-form').html(`
                <div class="form-group mb-4">
                    <label class="shadow radius pointer primary-border primary-color px-3 py-2" for="image">Sélectionner une image</label>
                    <input type="file" id="image" accept=".jpg, .png, .jpeg">
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="name">Nom:</label>
                    <input type="text" class="form-control shadow radius primary-border primary-color px-3 py-2" id="name" placeholder="Le nom de le produit">
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="description">Description:</label>
                    <input type="text" class="form-control shadow radius primary-border primary-color px-3 py-2" id="description" placeholder="La description de le produit">
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="price">Prix:</label>
                    <input type="number" class="form-control shadow radius primary-border primary-color px-3 py-2" id="price" placeholder="Le prix de le produit">
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="quantity">Quantité:</label>
                    <input type="number" class="form-control shadow radius primary-border primary-color px-3 py-2" id="quantity" placeholder="La quantité de le produit">
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="category">Catégorie:</label>
                    <input type="text" class="form-control shadow radius primary-border primary-color px-3 py-2" id="category" placeholder="La catégorie de le produit">
                </div>
                <div class="d-flex justify-content-center align-items-center">
                    <button class="btn font-weight-semibold primary-color bg-secondary-color shadow radius px-5 py-2 form-add-btn">Ajouter</button>
                </div>
            `);

            $('.form-add-btn').on('click', function(event) {
                event.preventDefault();  

                let image = $('#image')[0].files[0];
                let name = $('#name').val();
                let description = $('#description').val();
                let price = $('#price').val();
                let quantity = $('#quantity').val();
                let category = $('#category').val().toLowerCase();
                                
                if (
                    image
                    && name !== ''
                    && description !== ''
                    && price > 0
                    && quantity > 0
                    && category !== '' 
                ) {
                    let formData = new FormData();

                    formData.append('image', image);
                    formData.append('model', model);
                    formData.append('token', token);
                
                    $.ajax({
                        type: 'POST',
                        url: 'http://localhost:5000/admin/upload/',
                        data: formData,
                        contentType: false,
                        processData: false,
                        success: (data) => {
                            $.ajax({
                                type: 'POST',
                                url: 'http://localhost:5000/admin/data/',
                                data: JSON.stringify({
                                    token: token,
                                    model: model,
                                    image: data.image,
                                    name: name,
                                    description: description,
                                    price: price,
                                    quantity: quantity,
                                    category: category
                                }),
                                contentType: 'application/json',
                                success: (data) => {
                                    getData();
        
                                    $('#modal-container-2').removeClass('d-flex');
                                    $('#modal-container-2').addClass('d-none');
        
                                    $('.data-form').empty();
                                }
                            });                        
                        }
                    });
                }
            });            

            $('#modal-container-2').removeClass('d-none');
            $('#modal-container-2').addClass('d-flex');            
            break;

        case 'categories':
            $('.data-form').html(`
                <div class="form-group mb-4">
                    <label class="shadow radius pointer primary-border primary-color px-3 py-2" for="image">Sélectionner une image</label>
                    <input type="file" id="image" accept=".jpg, .png, .jpeg">
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="name">Nom:</label>
                    <input type="text" class="form-control shadow radius primary-border primary-color px-3 py-2" id="name" placeholder="Le nom de la catégorie">
                </div>
                <div class="d-flex justify-content-center align-items-center">
                    <button class="btn font-weight-semibold primary-color bg-secondary-color shadow radius px-5 py-2 form-add-btn">Ajouter</button>
                </div>
            `);

            $('.form-add-btn').on('click', function(event) {
                event.preventDefault();

                let image = $('#image')[0].files[0];
                let name = $('#name').val();

                if (
                    image
                    && name !== ''
                ) {
                    let formData = new FormData();

                    formData.append('image', image);
                    formData.append('model', model);
                    formData.append('token', token);
                
                    $.ajax({
                        type: 'POST',
                        url: 'http://localhost:5000/admin/upload/',
                        data: formData,
                        contentType: false,
                        processData: false,
                        success: (data) => {
                            $.ajax({
                                type: 'POST',
                                url: 'http://localhost:5000/admin/data/',
                                data: JSON.stringify({
                                    token: token,
                                    model: model,
                                    image: data.image,
                                    name: name
                                }),
                                contentType: 'application/json',
                                success: (data) => {
                                    getData();
        
                                    $('#modal-container-2').removeClass('d-flex');
                                    $('#modal-container-2').addClass('d-none');
        
                                    $('.data-form').empty();
                                }
                            });                        
                        }
                    });
                }
            });            

            $('#modal-container-2').removeClass('d-none');
            $('#modal-container-2').addClass('d-flex');
            break;
    }
}

function putData(model, id) {
    var token = $('#token').val();

    switch (model) {
        case 'products':
            product = products.filter((product) => product.id === id)[0];

            $('.data-form').html(`
                <div class="form-group mb-4">
                    <label class="shadow radius pointer primary-border primary-color px-3 py-2" for="image">Sélectionner une image</label>
                    <input type="file" id="image" accept=".jpg, .png, .jpeg">
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="name">Nom:</label>
                    <input type="text" class="form-control shadow radius primary-border primary-color px-3 py-2" id="name" placeholder="Le nom de le produit" value="${product.name}" />
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="description">Description:</label>
                    <input type="text" class="form-control shadow radius primary-border primary-color px-3 py-2" id="description" placeholder="La description de le produit" value="${product.description}" />
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="price">Prix:</label>
                    <input type="number" class="form-control shadow radius primary-border primary-color px-3 py-2" id="price" placeholder="Le prix de le produit" value="${product.price}" />
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="quantity">Quantité:</label>
                    <input type="number" class="form-control shadow radius primary-border primary-color px-3 py-2" id="quantity" placeholder="La quantité de le produit" value="${product.quantity}" />
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="category">Catégorie:</label>
                    <input type="text" class="form-control shadow radius primary-border primary-color px-3 py-2" id="category" placeholder="La catégorie de le produit" value="${product.category.name}" />
                </div>
                <div class="d-flex justify-content-center align-items-center">
                    <button class="btn font-weight-semibold primary-color bg-secondary-color shadow radius px-5 py-2 form-modify-btn">Modifier</button>
                </div>
            `);

            $('.form-modify-btn').on('click', function(event) {
                event.preventDefault();

                let image = $('#image')[0].files[0];
                let name = $('#name').val();
                let description = $('#description').val();
                let price = $('#price').val();
                let quantity = $('#quantity').val();
                let category = $('#category').val().toLowerCase();

                if (
                    image
                    || name !== ''
                    || description !== ''
                    || price > 0
                    || quantity > 0
                    || category !== '' 
                ) {
                    let formData = new FormData();

                    formData.append('image', image);
                    formData.append('model', model);
                    formData.append('token', token);
                
                    $.ajax({
                        type: 'POST',
                        url: 'http://localhost:5000/admin/upload/',
                        data: formData,
                        contentType: false,
                        processData: false,
                        success: (data) => {
                            $.ajax({
                                type: 'PUT',
                                url: 'http://localhost:5000/admin/data/',
                                data: JSON.stringify({
                                    token: token,
                                    id: id,
                                    model: model,
                                    image: data.image,
                                    name: name,
                                    description: description,
                                    price: price,
                                    quantity: quantity,
                                    category: category
                                }),
                                contentType: 'application/json',
                                success: (data) => {
                                    getData();
        
                                    $('#modal-container-2').removeClass('d-flex');
                                    $('#modal-container-2').addClass('d-none');
        
                                    $('.data-form').empty();
                                }
                            });                        
                        }
                    });
                }
            });            

            $('#modal-container-2').removeClass('d-none');
            $('#modal-container-2').addClass('d-flex');            
            break;

        case 'categories':
            category = categories.filter((category) => category.id === id)[0];

            $('.data-form').html(`
                <div class="form-group mb-4">
                    <label class="shadow radius pointer primary-border primary-color px-3 py-2" for="image">Sélectionner une image</label>
                    <input type="file" id="image" accept=".jpg, .png, .jpeg">
                </div>
                <div class="form-group mb-4">
                    <label class="font-weight-semibold" for="name">Nom:</label>
                    <input type="text" class="form-control shadow radius primary-border primary-color px-3 py-2" id="name" placeholder="Le nom de la catégorie" value="${category.name}" />
                </div>
                <div class="d-flex justify-content-center align-items-center">
                    <button class="btn font-weight-semibold primary-color bg-secondary-color shadow radius px-5 py-2 form-modify-btn">Modifier</button>
                </div>
            `);

            $('.form-modify-btn').on('click', function(event) {
                event.preventDefault();
                
                let image = $('#image')[0].files[0];
                let name = $('#name').val();

                if (
                    image
                    || name !== ''
                ) {
                    let formData = new FormData();

                    formData.append('image', image);
                    formData.append('model', model);
                    formData.append('token', token);
                
                    $.ajax({
                        type: 'POST',
                        url: 'http://localhost:5000/admin/upload/',
                        data: formData,
                        contentType: false,
                        processData: false,
                        success: (data) => {
                            $.ajax({
                                type: 'PUT',
                                url: 'http://localhost:5000/admin/data/',
                                data: JSON.stringify({
                                    token: token,
                                    id: id,
                                    model: model,
                                    image: data.image,
                                    name: name
                                }),
                                contentType: 'application/json',
                                success: (data) => {
                                    getData();
        
                                    $('#modal-container-2').removeClass('d-flex');
                                    $('#modal-container-2').addClass('d-none');
        
                                    $('.data-form').empty();
                                }
                            });                        
                        }
                    });
                }
            });            

            $('#modal-container-2').removeClass('d-none');
            $('#modal-container-2').addClass('d-flex');
            break;

    }
}

function deleteData(model, id) {
    var token = $('#token').val();

    $.ajax({
        type: 'DELETE',
        url: 'http://localhost:5000/admin/data/',
        data: JSON.stringify({
            token: token,
            model: model,
            id: id
        }),
        contentType: 'application/json',
        success: (data) => {
            getData();
        }
    });
}

$(() => {
    $('.login-btn').on('click', function(event) {
        event.preventDefault();

        login();
    });

    $('.modal-close-btn').on('click', function(event) {
        $('.modal-container').removeClass('d-flex');
        $('.modal-container').addClass('d-none');
    });
});
