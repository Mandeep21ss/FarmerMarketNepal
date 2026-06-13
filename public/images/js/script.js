// Contact form feedback and cart implementation
document.addEventListener('DOMContentLoaded', function(){
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      const formMessage = document.getElementById('formMessage');
      if (name && email && message) {
        formMessage.innerHTML = `<div class="alert alert-success">✅ Thank you, ${name}! Your message has been sent.</div>`;
        this.reset();
      } else {
        formMessage.innerHTML = `<div class="alert alert-danger">❌ Please fill out all fields.</div>`;
      }
    });
  }
});

let cart = [];

function addToCart(productName, price) {
  const existing = cart.find(item => item.name === productName);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ name: productName, price: price, quantity: 1 });
  }
  updateCart();
  // Open modal after adding
  const modalEl = document.getElementById('cartModal');
  if (modalEl) new bootstrap.Modal(modalEl).show();
}

function removeFromCart(productName) {
  cart = cart.filter(item => item.name !== productName);
  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");

  if (!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItems.innerHTML = "<tr><td colspan='5'>Your cart is empty.</td></tr>";
  } else {
    cart.forEach(item => {
      const row = document.createElement("tr");
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.price}</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity('${item.name}', -1)">-</button>
          ${item.quantity}
          <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity('${item.name}', 1)">+</button>
        </td>
        <td>${itemTotal}</td>
        <td><button class="btn btn-sm btn-danger" onclick="removeFromCart('${item.name}')">Remove</button></td>
      `;
      cartItems.appendChild(row);
    });
  }

  if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartTotal) cartTotal.textContent = total;
}

function changeQuantity(productName, change) {
  const item = cart.find(i => i.name === productName);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) removeFromCart(productName);
  }
  updateCart();
}

// Simple reviews slider (keeps original behavior)
const wrapper = document.querySelector('.review-wrapper');
if (wrapper) {
  const reviews = document.querySelectorAll('.review');
  reviews.forEach(review => wrapper.appendChild(review.cloneNode(true)));
  let position = 0; let speed = 1;
  function moveSlider(){ position -= speed; wrapper.style.transform = `translateX(${position}px)`; if (Math.abs(position) >= wrapper.scrollWidth/2) position = 0; requestAnimationFrame(moveSlider); }
  moveSlider();
}
