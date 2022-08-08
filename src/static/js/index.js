$(() => {
    var descriptionFilter = '';
    var nameFilter = '';
    var priceFilter = 1000;
    var categoryFilter = 0;
    var cart = [];
    var total = 0.0;

    $('.product-image').on('click', function(event) {
        $('#modal-container-1').find('.product-display-image').attr('src', event.target.src);
      
        $('#modal-container-1').removeClass('d-none');
        $('#modal-container-1').addClass('d-flex');
    });

    $('.modal-close-container').on('click', function(event) {
        $(this).parent().parent().removeClass('d-flex');
        $(this).parent().parent().addClass('d-none');
    });

    $('.filter-bar-search-input-description').on('change', function(event) {
        descriptionFilter = event.target.value.toLowerCase();

        filter();
    });

    $('.filter-bar-search-input-name').on('change', function(event) {
        nameFilter = event.target.value.toLowerCase();

        filter();
    });

    $('.filter-bar-range-input').on('change', function(event) {
        priceFilter = event.target.value;
        
        $('.filter-bar-range-input-value').text(priceFilter);

        filter();
    });

    $('.filter-bar-category').on('click', function(event) {
        categoryFilter = Number($(this).find('.filter-bar-category-id').val());
        
        filter();
    });

    function filter() {
        $('.product').each(function(index, product) {
            $(this).hide();
    
            if (
                $(this).find('.product-description').text().toLowerCase().includes(descriptionFilter)
                && $(this).find('.product-name').text().toLowerCase().includes(nameFilter)    
                && Number($(this).find('.product-price').text()) <= Number(priceFilter)
                && Number($(this).find('.product-price').text()) <= Number(priceFilter)
                && (Number($(this).find('.product-category-id').val()) === categoryFilter || categoryFilter === 0)
            ) {
                $(this).show();
            }
        });
    }

    $('.product-add-btn').on('click', function(event) {
        let id = Number($(this).parent().parent().find('.product-id').val());
        let image = $(this).parent().parent().find('.product-image').attr('src');
        let name = $(this).parent().parent().find('.product-name').text();
        let price = Number($(this).parent().parent().find('.product-price').text()).toFixed(2);
        let quantity = Number($(this).parent().parent().find('.product-quantity').val());
        
        cartProducts = cart.filter((cartProduct) => cartProduct?.id === id);

        if (cartProducts.length === 0) {
            cart.push({
                id: id,
                quantity: 1
            });

            total = (Number(total) + Number(price)).toFixed(2);
            $('.cart-total').text(total);

            $('.cart-products').append(`
                <div class="px-2 py-1 cart-product">
                    <input class="cart-product-id" type="hidden" value="${id}" />  
                    <input class="cart-product-quantity" type="hidden" value="${quantity}" />  
                    <img class="radius cart-product-image" src="${image}" alt="Produit de Panier" />
                    <p class="font-weight-semibold cart-product-name">${name}</p>
                    <div class="d-flex justify-content-center">
                        <i class="material-icons pointer text-danger cart-product-remove-icon" id="cart-product-remove-icon-${id}">close</i>
                    </div>
                    <p class="font-weight-semibold cart-product-price-container">
                        <span class="cart-product-price">${price}</span>
                        MAD
                    <p>
                        <i class="material-icons cart-product-amount-add-icon pointer" id="cart-product-amount-add-icon-${id}">add_circle</i>
                        <span class="font-weight-semibold cart-product-amount">1</span>
                        <i class="material-icons cart-product-amount-remove-icon pointer" id="cart-product-amount-remove-icon-${id}">remove_circle</i>
                    </p>
                </div>
            `);
    
            $(`#cart-product-remove-icon-${id}`).on('click', function(event) {
                cart = cart.filter((cartProduct) => cartProduct.id !== id); 

                let amount = Number($(this).parent().parent().find('.cart-product-amount').text());
                let price = Number($(this).parent().parent().find('.cart-product-price').text());

                total = (Number(total) - (price * amount)).toFixed(2);
                $('.cart-total').text(total);
                
                $(this).parent().parent().remove();
            });
        
            $(`#cart-product-amount-add-icon-${id}`).on('click', function(event) {
                let id = Number($(this).parent().parent().find('.cart-product-id').val());
                let quantity = Number($(this).parent().parent().find('.cart-product-quantity').val());
                let price = Number($(this).parent().parent().find('.cart-product-price').text());
                let amount = Number($(this).next().text());

                if (amount < quantity) {
                    amount = amount + 1;
                    $(this).next().text(amount);
                
                    total = (Number(total) + price).toFixed(2);
                    $('.cart-total').text(total);

                    cart.map((cartProduct) => {
                        if (cartProduct.id === id) {
                            cartProduct.quantity += 1
                        }
                    });
                }
            });    

            $(`#cart-product-amount-remove-icon-${id}`).on('click', function(event) {
                let id = Number($(this).parent().parent().find('.cart-product-id').val());
                let price = Number($(this).parent().parent().find('.cart-product-price').text());
                let amount = Number($(this).prev().text());
                
                if (amount > 1) {
                    amount = amount - 1;
                    $(this).prev().text(amount);
                
                    total = (Number(total) - price).toFixed(2);
                    $('.cart-total').text(total);
                
                    cart.map((cartProduct) => {
                        if (cartProduct.id === id) {
                            cartProduct.quantity -= 1
                        }
                    });
                }
            });            
        }
    });

    $('.checkout-btn').on('click', function(event) {
        if (cart.length > 0) {
            $('#modal-container-2').removeClass('d-none');
            $('#modal-container-2').addClass('d-flex');
        }
    });

    $('.validate-btn').on('click', function(event) {
        event.preventDefault();
        
        let firstName = $('#first_name').val();
        let lastName = $('#last_name').val();
        let address = $('#address').val();
        let city = $('#city').val();
        let phone = $('#phone').val();
        
        if (
            firstName !== ''
            && lastName !== ''
            && address !== ''
            && city !== ''
            && phone !== ''
            && cart.length > 0
        ) {        
            $.ajax({
                type: 'POST',
                url: 'http://localhost:5000/',
                data: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    address: address,
                    city: city,
                    phone: phone,
                    cart: cart
                }),
                contentType: 'application/json',
                success: (data) => {
                    cart = [];

                    total = 0.0;
                    $('.cart-total').text(total);

                    $('.cart-products').empty();

                    $('#modal-container-2').removeClass('d-flex');
                    $('#modal-container-2').addClass('d-none');

                    $('.order-form').trigger('reset');                                        

                    $('.order-id').text(data.order_id);

                    $('#modal-container-3').removeClass('d-none');
                    $('#modal-container-3').addClass('d-flex');
                }
            });
        }
    });
});
