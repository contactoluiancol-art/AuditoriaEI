// ======================
// LIMPIAR INTERVALOS
// ======================

if(window.refreshAuditoriasInterval){

  clearInterval(
    window.refreshAuditoriasInterval
  );

}





// ======================
// RESET FUNCIONES
// ======================

delete window.renderAuditorias;

delete window.generarPDF;

delete window.eliminarAuditoria;

delete window.editarEstado;

delete window.iniciarRefreshAuditorias;





// ======================
// EVITAR DUPLICAR
// ======================


// ======================
// BOTON
// ======================

var btnGuardarAuditoria =

document.getElementById(
  'guardarAuditoria'
);





// ======================
// EVENTO BOTON
// ======================

if(btnGuardarAuditoria){

  btnGuardarAuditoria.onclick = null;





  btnGuardarAuditoria.onclick =
  guardarAuditoria;

}





// ======================
// GUARDAR
// ======================

async function guardarAuditoria(){

  try{

    if(

      !window.tienePermiso(
        'auditorias',
        'crear'
      )

    ){

      alert(
        'No tiene permisos'
      );

      return;

    }





    var proceso =

    document.getElementById(
      'procesoInput'
    ).value.trim();





    var hallazgo =

    document.getElementById(
      'hallazgoInput'
    ).value.trim();





    var responsable =

    document.getElementById(
      'responsableInput'
    ).value.trim();





    var estado =

    document.getElementById(
      'estadoInput'
    ).value;





    if(

      !proceso ||
      !hallazgo ||
      !responsable

    ){

      alert(
        'Complete todos los campos'
      );

      return;

    }





    var response =

    await window.supabaseClient

    .from('auditorias')

    .insert([

      {

        proceso:
        proceso,

        hallazgo:
        hallazgo,

        responsable:
        responsable,

        estado:
        estado,

        created_at:
        new Date()
        .toISOString()

      }

    ]);





    if(response.error){

      console.log(
        response.error
      );

      alert(
        'Error guardando auditoría'
      );

      return;

    }





    if(typeof guardarHistorial === 'function'){

      await guardarHistorial(

        'CREAR',

        'AUDITORIAS',

        'Se creó auditoría del proceso ' +
        proceso

      );

    }





    await window.renderAuditorias();





    limpiarFormulario();





    alert(
      'Auditoría guardada'
    );

  }

  catch(error){

    console.log(error);

  }

}





// ======================
// RENDER
// ======================

window.renderAuditorias = async function(){

  try{

    var body =

    document.getElementById(
      'auditoriasBody'
    );





    if(!body){

      return;

    }





    var response =

    await window.supabaseClient

    .from('auditorias')

    .select('*')

    .order(

      'id',

      {

        ascending:false

      }

    );





    if(response.error){

      console.log(
        response.error
      );

      return;

    }





    var data =
    response.data || [];





    body.innerHTML = '';





    if(data.length === 0){

      body.innerHTML =

      '<tr>' +

      '<td colspan="6">' +

      'No hay auditorías' +

      '</td>' +

      '</tr>';



      return;

    }





    data.forEach(function(item){

      var estadoClass = '';





      if(item.estado === 'Pendiente'){

        estadoClass =
        'estado-pendiente';

      }

      else if(item.estado === 'En revisión'){

        estadoClass =
        'estado-revision';

      }

      else{

        estadoClass =
        'estado-cerrado';

      }





      body.innerHTML +=

      '<tr>' +

      '<td>' + item.proceso + '</td>' +

      '<td>' +

      '<div class="hallazgo-box">' +

      item.hallazgo +

      '</div>' +

      '</td>' +

      '<td>' + item.responsable + '</td>' +

      '<td>' +

      '<span class="' +

      estadoClass +

      '">' +

      item.estado +

      '</span>' +

      '</td>' +

      '<td>' +

      new Date(

        item.created_at

      ).toLocaleString('es-CO') +

      '</td>' +

      '<td>' +

      '<div class="acciones-tabla">' +





      (

        window.tienePermiso(
          'auditorias',
          'ver'
        )

        ?

     '<button class="btn-accion" onclick="generarPDF(' +
item.id +
')">📋</button>'

        :

        ''

      )





      +





      (

        window.tienePermiso(
          'auditorias',
          'editar'
        )

        ?

       '<button class="btn-accion" onclick="editarEstado(' +
item.id +
')">✏️</button>'

        :

        ''

      )





      +





      (

        window.tienePermiso(
          'auditorias',
          'eliminar'
        )

        ?

     '<button class="btn-accion" onclick="eliminarAuditoria(' +
item.id +
')">🗑️</button>'

        :

        ''

      )





      +





      '</div>' +

      '</td>' +

      '</tr>';

    });

  }

  catch(error){

    console.log(error);

  }

};





// ======================
// PDF
// ======================

window.generarPDF = async function(id){

  try{

    var response =

    await window.supabaseClient

    .from('auditorias')

    .select('*')

    .eq(

      'id',

      Number(id)

    )

    .single();





    var data =
    response.data;





    if(!data){

      return;

    }





    const { jsPDF } = window.jspdf;





    var doc = new jsPDF();





    doc.text(
      'Reporte Auditoría',
      20,
      20
    );





    doc.text(
      'Proceso: ' + data.proceso,
      20,
      40
    );





    doc.text(
      'Responsable: ' + data.responsable,
      20,
      50
    );





    doc.text(
      'Estado: ' + data.estado,
      20,
      60
    );





    doc.save(

      'Auditoria_' +

      data.id +

      '.pdf'

    );

  }

  catch(error){

    console.log(error);

  }

};





// ======================
// ELIMINAR
// ======================

window.eliminarAuditoria = async function(id){

  try{

    var confirmar = confirm(
      '¿Eliminar auditoría?'
    );



    if(!confirmar){

      return;

    }





    await window.supabaseClient

    .from('auditorias')

    .delete()

    .eq(

      'id',

      Number(id)

    );





    await window.renderAuditorias();

  }

  catch(error){

    console.log(error);

  }

};





// ======================
// EDITAR
// ======================

window.editarEstado = async function(id){

  try{

    var nuevoEstado = prompt(
      'Nuevo estado'
    );



    if(!nuevoEstado){

      return;

    }





    await window.supabaseClient

    .from('auditorias')

    .update({

      estado:
      nuevoEstado

    })

    .eq(

      'id',

      Number(id)

    );





    await window.renderAuditorias();

  }

  catch(error){

    console.log(error);

  }

};





// ======================
// REFRESH
// ======================

window.iniciarRefreshAuditorias = function(){

  if(window.refreshAuditoriasInterval){

    clearInterval(
      window.refreshAuditoriasInterval
    );

  }

  window.refreshAuditoriasInterval =

  setInterval(async function(){

    try{

      const body =

      document.getElementById(
        'auditoriasBody'
      );

      if(!body){

        return;

      }

      await window.renderAuditorias();

    }

    catch(error){

      console.log(
        'Error refresh auditorías:',
        error
      );

    }

  },2000);

};




// ======================
// LIMPIAR
// ======================

function limpiarFormulario(){

  document.getElementById(
    'procesoInput'
  ).value = '';



  document.getElementById(
    'hallazgoInput'
  ).value = '';



  document.getElementById(
    'responsableInput'
  ).value = '';



  document.getElementById(
    'estadoInput'
  ).value = 'Pendiente';

}





// ======================
// PERMISOS
// ======================

function aplicarPermisosAuditorias(){

  if(

    !window.tienePermiso(
      'auditorias',
      'crear'
    )

  ){

    if(btnGuardarAuditoria){

      btnGuardarAuditoria.style.display =
      'none';

    }

  }

}





// ======================
// INICIO
// ======================

aplicarPermisosAuditorias();

window.renderAuditorias();

window.iniciarRefreshAuditorias();

