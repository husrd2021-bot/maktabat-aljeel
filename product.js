'use strict';
let productPhotoCarousel=null;

function clearProductPhotoCarousel(){
 if(!productPhotoCarousel)return;
 clearInterval(productPhotoCarousel.timer);
 productPhotoCarousel=null;
}

function productPhotosMarkup(product,images){
 if(images.length<2)return `<div class="product-main-image">${cover(product)}</div>`;
 return `<section class="product-photo-carousel" aria-label="صور المنتج">
  <div class="product-main-image" data-photo-viewport>
   ${images.map((image,index)=>`<div class="product-photo-slide ${index===0?'is-current':''}" aria-hidden="${index!==0}">${index===0?cover(product):`<img class="catalog-thumbnail" data-public-media="${escapeCatalog(image.storageKey)}" alt="${escapeCatalog(product.title)} — صورة ${index+1}" width="300" height="240">`}</div>`).join('')}
   <div class="product-photo-controls">
    <div class="product-photo-dots" role="group" aria-label="اختيار صورة" dir="ltr">
     ${images.map((_,index)=>`<button type="button" aria-label="عرض الصورة ${index+1}" aria-current="${index===0}" data-photo-index="${index}"></button>`).join('')}
    </div>
    <button class="product-photo-pause" type="button" aria-label="إيقاف التقليب التلقائي">Ⅱ</button>
   </div>
  </div>
 </section>`;
}

function setupProductPhotoCarousel(element,key){
 const slides=[...element.querySelectorAll('.product-photo-slide')];
 const dots=[...element.querySelectorAll('[data-photo-index]')];
 const pause=element.querySelector('.product-photo-pause');
 const viewport=element.querySelector('[data-photo-viewport]');
 let index=0,paused=false,leaving=null,touch=null;
 const carousel={element,key,timer:null};

 function show(target,direction){
  if(target===index)return;
  leaving?.classList.remove('is-leaving');
  leaving=slides[index];
  leaving.classList.remove('is-current','is-entering');
  leaving.classList.add('is-leaving');
  leaving.setAttribute('aria-hidden','true');
  dots[index].setAttribute('aria-current','false');
  element.classList.toggle('is-reversed',direction==='reverse');
  index=target;
  slides[index].classList.add('is-current','is-entering');
  slides[index].setAttribute('aria-hidden','false');
  dots[index].setAttribute('aria-current','true');
 }
 function schedule(){
  clearInterval(carousel.timer);
  if(paused)return;
  carousel.timer=setInterval(()=>{
   if(!document.hidden&&!touch)show((index+1)%slides.length,'forward');
  },4000);
 }
 for(const dot of dots)dot.addEventListener('click',()=>{
  show(Number(dot.dataset.photoIndex),'forward');
  schedule();
 });
 pause.addEventListener('click',()=>{
  paused=!paused;
  pause.textContent=paused?'▶':'Ⅱ';
  pause.setAttribute('aria-label',paused?'تشغيل التقليب التلقائي':'إيقاف التقليب التلقائي');
  schedule();
 });
 viewport.addEventListener('touchstart',event=>{
  if(event.touches.length===1&&!event.target.closest('button'))touch=event.touches[0];
 },{passive:true});
 viewport.addEventListener('touchend',event=>{
  if(!touch)return;
  const end=[...event.changedTouches].find(item=>item.identifier===touch.identifier);
  if(!end)return;
  const dx=end.clientX-touch.clientX,dy=end.clientY-touch.clientY;
  touch=null;
  if(Math.abs(dx)<40||Math.abs(dx)<=Math.abs(dy))return;
  const step=dx>0?1:-1;
  show((index+step+slides.length)%slides.length,step>0?'forward':'reverse');
  schedule();
 },{passive:true});
 viewport.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
 productPhotoCarousel=carousel;
 schedule();
}

function renderProductPage(){
 const id=Number(location.hash.split('/')[1]),b=books.find(p=>p.id===id);
 if(!b){clearProductPhotoCarousel();main.innerHTML=`<a class="orders-history-link" href="#home">← العودة للمنتجات</a>${empty('book','المنتج غير متاح حالياً','قد يكون جارٍ تحميله أو أوقف المتجر عرضه.')}`;return;}
 const selected=favoriteIds.includes(b.id),images=b.media.filter(file=>file.kind==='image');
 const videos=b.media.filter(file=>file.kind==='video');
 const photoKey=JSON.stringify([b.id,b.title,images.map(file=>file.storageKey)]);
 const existingCarousel=productPhotoCarousel?.key===photoKey?productPhotoCarousel.element:null;
 if(!existingCarousel)clearProductPhotoCarousel();
 main.innerHTML=`<a class="orders-history-link" href="#home">← العودة للمنتجات</a><article class="product-page ${b.active?'':'product-inactive'}"><div class="product-page-media">${existingCarousel?'<div data-product-photo-slot></div>':productPhotosMarkup(b,images)}${videos.map(f=>`<video controls playsinline preload="metadata" data-detail-video="${escapeCatalog(f.storageKey)}" aria-label="فيديو توضيحي عن ${escapeCatalog(b.title)}"></video>`).join('')}</div><div class="product-page-info"><p class="eyebrow">${escapeCatalog(b.category)}</p><h1>${escapeCatalog(b.title)}</h1><div class="product-page-price"><p class="minimum-order-note">كود المنتج: <bdi>${escapeCatalog(b.code||'P-'+b.id)}</bdi></p>${productPrice(b)}</div>${!b.active?'<p class="product-unavailable-label">غير متاح حالياً</p>':''}<p class="product-description">${escapeCatalog(b.detail||'لم يضف المتجر وصفاً بعد.')}</p><p>${b.productKind==='physical'&&b.stock!=null?'المتاح: '+money(b.stock)+' قطعة':b.productKind==='digital'?'منتج رقمي أو خدمة':''}</p><p class="minimum-order-note">أقل كمية للطلب: ${money(b.minOrderQty||1)}</p><p class="product-delivery-note">${b.shippingFee>0?'التوصيل 5,000 د.ع مرة واحدة للطلب لكل العراق.':'بدون كلفة توصيل.'}</p>${b.pricingMode==='relative'?'<p class="quote-notice">أرفق ملفك وملاحظاتك في السلة. تراجع الإدارة الطلب وترسل السعر النهائي، ولك الموافقة أو الرفض قبل التجهيز.</p>':''}<div class="product-page-actions"><button class="add-to-cart" data-action="add" data-id="${b.id}" ${!b.active||b.productKind==='physical'&&b.stock===0?'disabled':''}>${icon('cart')} ${!b.active?'غير متاح حالياً':b.productKind==='physical'&&b.stock===0?'نفدت الكمية':b.pricingMode==='relative'?'إضافة طلب تسعير للسلة':'إضافة إلى السلة'}</button><button  ${!b.active?'disabled':''} class="product-favorite ${selected?'selected':''}" data-action="favorite" data-id="${b.id}" aria-pressed="${selected}">${icon('heart')} ${selected?'إزالة من المفضلة':'إضافة للمفضلة'}</button><a class="orders-history-link" href="#cart">فتح السلة ←</a></div></div></article>`;
 if(existingCarousel)main.querySelector('[data-product-photo-slot]').replaceWith(existingCarousel);
 else if(images.length>1)setupProductPhotoCarousel(main.querySelector('.product-photo-carousel'),photoKey);
 for(const video of main.querySelectorAll('[data-detail-video]'))AljeelStore.assetUrl(video.dataset.detailVideo).then(url=>{if(video.isConnected)video.src=url;}).catch(()=>{if(video.isConnected)video.insertAdjacentHTML('afterend','<p>تعذر تحميل الفيديو. حاول مجدداً.</p>');});
}
