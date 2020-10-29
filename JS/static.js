$(window).on('load',function() {
    $('.preload-wrapper').delay(0).fadeOut('slow');
  });
  
  var animation = bodymovin.loadAnimation({
    container: document.getElementById('preload'),
    render: 'svg',
    loop: true,
    autoplay: false,
    path: 'https://ddc-media.s3.us-east-2.amazonaws.com/logos/data.json'
  });
  
  var swiper = new Swiper('.swiper-container', {
    slidesPerView: 2,
    spaceBetween: 30,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      640: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      768: {
        slidesPerView: 3,
        spaceBetween: 40,
      },
      1024: {
        slidesPerView: 4,
        spaceBetween: 50,
      },
    }
  });
  
  $('#opponent_select').on('click', function() {
  
      var opp_val = $('#opponents option:selected').data('teamid');
      var w = 0
      var l = 0
  
      $('.matchup-table .game-row').each(function() {
  
          var row_val = $(this).data('opponentid');
          var result = $(this).children('.result').data('result')
  
          if (opp_val == 00) {
              $(this).show();
          }
          else if (opp_val == row_val) {
              $(this).show();
  
              if (result == 'w') {
                  w += 1
              } else {
                  l += 1
              }
              
          } else {
              $(this).hide();
          }
  
          $('#wins').text(w);
          $('#loss').text(l);
      });
  
  })
  
  $('#menu-toggle').click(function(){
    $(this).toggleClass('open');
    $('.mobile-nav').toggleClass('open');
  })