
window.mostrarNotificacion = function(

  titulo,
  mensaje,
  tipo = 'success'

){

  const modal = document.getElementById(
    'modalGlobal'
  );

  const icono = document.getElementById(
    'modalGlobalIcono'
  );

  const tituloHtml = document.getElementById(
    'modalGlobalTitulo'
  );

  const mensajeHtml = document.getElementById(
    'modalGlobalMensaje'
  );

  if(tipo === 'success'){

    icono.innerHTML = '✅';

  }

  if(tipo === 'error'){

    icono.innerHTML = '❌';

  }

  if(tipo === 'warning'){

    icono.innerHTML = '⚠️';

  }

  if(tipo === 'info'){

    icono.innerHTML = 'ℹ️';

  }

  tituloHtml.innerText =
  titulo;

  mensajeHtml.innerText =
  mensaje;

  modal.classList.add(
    'active'
  );

};
