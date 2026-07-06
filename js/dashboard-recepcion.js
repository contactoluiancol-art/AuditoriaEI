// ======================
// SUPABASE
// ======================

const supabaseUrl =
'https://hurxdjoiafkjoyrmyhbd.supabase.co';

const supabaseKey =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cnhkam9pYWZram95cm15aGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzgxMTMsImV4cCI6MjA5NTMxNDExM30.Z6fRiWft3eSEVNZbWflmcvVcHAJTAEA37tPdp4LRnTg';

const supabaseClient =
supabase.createClient(
  supabaseUrl,
  supabaseKey
);

// ======================
// GRAFICOS
// ======================

let graficoRecepciones = null;
let graficoNovedades = null;
let graficoTendencia = null;

// ======================
// MESES
// ======================

const ordenMeses = [

  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'

];

// ======================
// CARGAR DASHBOARD
// ======================

async function cargarDashboard(){

  try{

    const { data, error } =

    await supabaseClient

    .from('recepciones')

    .select('*');

    if(error){

      console.log(error);

      return;

    }

    construirDashboard(
      data || []
    );

  }

  catch(error){

    console.log(error);

  }

}

// ======================
// DASHBOARD
// ======================

function construirDashboard(
  recepciones
){

  let totalRecepciones = 0;
  let totalFaltantes = 0;
  let totalSobrantes = 0;
  let totalDanados = 0;

  const resumenMeses = {};

  recepciones.forEach(item => {

    totalRecepciones++;

    const fecha =
    new Date(
      item.created_at
    );

    const mes =

    fecha.toLocaleString(
      'es-CO',
      {
        month:'long'
      }
    )
    .toLowerCase();

    if(!resumenMeses[mes]){

      resumenMeses[mes] = {

        recepciones:0,
        faltantes:0,
        sobrantes:0,
        danados:0

      };

    }

    resumenMeses[mes]
    .recepciones++;
const estado =

(
  item.novedad_original ||
  item.estado ||
  ''
)
.toLowerCase();

    if(
      estado === 'faltante'
    ){

      totalFaltantes++;

      resumenMeses[mes]
      .faltantes++;

    }

    if(
      estado === 'sobrante'
    ){

      totalSobrantes++;

      resumenMeses[mes]
      .sobrantes++;

    }

    if(
      estado === 'dañado'
    ){

      totalDanados++;

      resumenMeses[mes]
      .danados++;

    }

  });

  // KPI

  document.getElementById(
    'kpiTotalRecepciones'
  ).innerText =
  totalRecepciones;

  document.getElementById(
    'kpiFaltantes'
  ).innerText =
  totalFaltantes;

  document.getElementById(
    'kpiSobrantes'
  ).innerText =
  totalSobrantes;

  document.getElementById(
    'kpiDanados'
  ).innerText =
  totalDanados;

  // ======================
  // TABLA
  // ======================

  const body =

  document.getElementById(
    'dashboardRecepcionBody'
  );

  body.innerHTML = '';

  const mesesOrdenados =

  ordenMeses.filter(
    mes =>
    resumenMeses[mes]
  );

  let mesMasActivo = '-';
  let valorMasActivo = 0;

  let mesMasCritico = '-';
  let valorMasCritico = 0;

  mesesOrdenados.forEach(mes => {

    const item =
    resumenMeses[mes];

    const totalNovedades =

    item.faltantes +
    item.sobrantes +
    item.danados;

    if(
      item.recepciones >
      valorMasActivo
    ){

      valorMasActivo =
      item.recepciones;

      mesMasActivo =
      mes;

    }

    if(
      totalNovedades >
      valorMasCritico
    ){

      valorMasCritico =
      totalNovedades;

      mesMasCritico =
      mes;

    }

    body.innerHTML += `

    <tr>

      <td>${mes}</td>

      <td>${item.recepciones}</td>

      <td>${item.faltantes}</td>

      <td>${item.sobrantes}</td>

      <td>${item.danados}</td>

      <td>${totalNovedades}</td>

    </tr>

    `;

  });

  // ======================
  // INDICADORES
  // ======================

  const activoEl =
  document.getElementById(
    'mesMasActivo'
  );

  if(activoEl){

    activoEl.innerText =
    mesMasActivo;

  }

  const criticoEl =
  document.getElementById(
    'mesMasCritico'
  );

  if(criticoEl){

    criticoEl.innerText =
    mesMasCritico;

  }

  // ======================
  // GRAFICOS
  // ======================

 crearGraficoRecepciones(
  mesesOrdenados,
  resumenMeses
);

crearGraficoNovedades(
  totalFaltantes,
  totalSobrantes,
  totalDanados
);

  crearGraficoTendencia(
  mesesOrdenados,
  resumenMeses
);

calcularSaludOperativa(
  totalRecepciones,
  totalFaltantes,
  totalSobrantes,
  totalDanados
);

construirTopProveedores(
  recepciones
);

construirTopMateriales(
  recepciones
);
  }

// ======================
// GRAFICO BARRAS
// ======================

function crearGraficoRecepciones(
  mesesOrdenados,
  resumenMeses
){

  const canvas =

  document.getElementById(
    'graficoRecepciones'
  );

  if(!canvas){

    return;

  }

  if(graficoRecepciones){

    graficoRecepciones.destroy();

  }

  graficoRecepciones =

  new Chart(canvas,{

    type:'bar',

    data:{

      labels:
      mesesOrdenados,

      datasets:[{

        label:
        'Recepciones Registradas',

        data:

        mesesOrdenados.map(
          mes =>
          resumenMeses[mes]
          .recepciones
        ),

        backgroundColor:
        '#2563eb',

        borderRadius:10

      }]

    },

    options:{

      responsive:true,

      plugins:{

        legend:{

          display:false

        }

      }

    }

  });

}

// ======================
// GRAFICO DONA
// ======================

function crearGraficoNovedades(
  faltantes,
  sobrantes,
  danados
){

  const canvas =

  document.getElementById(
    'graficoNovedades'
  );

  if(!canvas){

    return;

  }

  if(graficoNovedades){

    graficoNovedades.destroy();

  }

  graficoNovedades =

  new Chart(canvas,{

    type:'doughnut',

    data:{

      labels:[

        'Faltantes',
        'Sobrantes',
        'Dañados'

      ],

      datasets:[{

        data:[

          faltantes,
          sobrantes,
          danados

        ],

        backgroundColor:[

          '#f59e0b',
          '#3b82f6',
          '#ef4444'

        ]

      }]

    },

    options:{

      responsive:true,

      plugins:{

        legend:{

          position:'bottom'

        }

      }

    }

  });

}

// ======================
// INICIO
// ======================

document.addEventListener(
'DOMContentLoaded',
function(){

  cargarDashboard();

});

// ======================
// EXPORTAR PDF
// ======================

document.addEventListener(
'click',
function(e){

  if(
    e.target &&
    e.target.id ===
    'exportarPdfBtn'
  ){

    exportarDashboardPDF();

  }

});

function exportarDashboardPDF(){

  const { jsPDF } =
  window.jspdf;

  const doc =
  new jsPDF();

  const fecha =

  new Date()
  .toLocaleString(
    'es-CO'
  );

  doc.setFontSize(20);

  doc.text(

    'ELECTROINGENIERÍA',

    20,

    20

  );

  doc.setFontSize(14);

  doc.text(

    'Dashboard Ejecutivo Recepciones',

    20,

    30

  );

  doc.setFontSize(10);

  doc.text(

    'Fecha: ' + fecha,

    20,

    40

  );

  // KPI

  const recepciones =

  document.getElementById(
    'kpiTotalRecepciones'
  ).innerText;

  const faltantes =

  document.getElementById(
    'kpiFaltantes'
  ).innerText;

  const sobrantes =

  document.getElementById(
    'kpiSobrantes'
  ).innerText;

  const danados =

  document.getElementById(
    'kpiDanados'
  ).innerText;

  doc.text(
    'Recepciones: ' + recepciones,
    20,
    60
  );

  doc.text(
    'Faltantes: ' + faltantes,
    20,
    70
  );

  doc.text(
    'Sobrantes: ' + sobrantes,
    20,
    80
  );

  doc.text(
    'Dañados: ' + danados,
    20,
    90
  );

  const activo =

  document.getElementById(
    'mesMasActivo'
  ).innerText;

  const critico =

  document.getElementById(
    'mesMasCritico'
  ).innerText;

  doc.text(
    'Mes mas activo: ' + activo,
    20,
    110
  );

  doc.text(
    'Mes mas critico: ' + critico,
    20,
    120
  );

  let y = 140;

  doc.setFontSize(12);

  doc.text(

    'Consolidado Mensual',

    20,

    y

  );

  y += 10;

  const filas =

  document.querySelectorAll(
    '#dashboardRecepcionBody tr'
  );

  filas.forEach(function(fila){

    doc.text(

      fila.innerText,

      20,

      y

    );

    y += 10;

  });

  doc.save(

    'Dashboard_Recepciones.pdf'

  );

}

  // ======================
// SALUD OPERATIVA
// ======================

function calcularSaludOperativa(
  totalRecepciones,
  faltantes,
  sobrantes,
  danados
){

  const totalNovedades =
  faltantes +
  sobrantes +
  danados;

  let salud = 100;

  if(totalRecepciones > 0){

    salud =
    100 -
    (
      totalNovedades /
      totalRecepciones
    ) * 100;

  }

  salud = Math.max(
    salud,
    0
  );

  const elemento =
  document.getElementById(
    'saludOperativa'
  );

  if(elemento){

    elemento.innerText =
    salud.toFixed(1) + '%';

  }

}

// ======================
// TOP PROVEEDORES
// ======================

function construirTopProveedores(
  recepciones
){

  const proveedores = {};

  recepciones.forEach(item => {

    const estado =
(
  item.novedad_original ||
  item.estado ||
  ''
).toLowerCase();
    if(
      estado === 'faltante' ||
      estado === 'sobrante' ||
      estado === 'dañado'
    ){

      const proveedor =
      item.proveedor ||
      'Sin Proveedor';

      proveedores[proveedor] =
      (
        proveedores[proveedor] || 0
      ) + 1;

    }

  });

  const ranking =

  Object.entries(
    proveedores
  )

  .sort(
    (a,b) =>
    b[1] - a[1]
  )

  .slice(0,5);

  const body =

  document.getElementById(
    'topProveedoresBody'
  );

  if(!body) return;

  body.innerHTML = '';

  ranking.forEach(item => {

    body.innerHTML += `

    <tr>

      <td>${item[0]}</td>

      <td>${item[1]}</td>

    </tr>

    `;

  });

}

// ======================
// TOP MATERIALES
// ======================

function construirTopMateriales(
  recepciones
){

  const materiales = {};

  recepciones.forEach(item => {

 const estado =
(
  item.novedad_original ||
  item.estado ||
  ''
).toLowerCase();

    if(
      estado === 'faltante' ||
      estado === 'sobrante' ||
      estado === 'dañado'
    ){

      const material =
      item.material ||
      'Sin Material';

      materiales[material] =
      (
        materiales[material] || 0
      ) + 1;

    }

  });

  const ranking =

  Object.entries(
    materiales
  )

  .sort(
    (a,b) =>
    b[1] - a[1]
  )

  .slice(0,5);

  const body =

  document.getElementById(
    'topMaterialesBody'
  );

  if(!body) return;

  body.innerHTML = '';

  ranking.forEach(item => {

    body.innerHTML += `

    <tr>

      <td>${item[0]}</td>

      <td>${item[1]}</td>

    </tr>

    `;

  });

}

// ======================
// TENDENCIA NOVEDADES
// ======================

function crearGraficoTendencia(
  mesesOrdenados,
  resumenMeses
){

  const canvas =

  document.getElementById(
    'graficoTendenciaNovedades'
  );

  if(!canvas){

    return;

  }

  if(graficoTendencia){

    graficoTendencia.destroy();

  }

  graficoTendencia =

  new Chart(canvas,{

    type:'line',

    data:{

      labels:
      mesesOrdenados,

      datasets:[{

        label:
        'Novedades',

        data:

        mesesOrdenados.map(

          mes =>

          resumenMeses[mes].faltantes +

          resumenMeses[mes].sobrantes +

          resumenMeses[mes].danados

        ),

        borderColor:'#ef4444',

        backgroundColor:'#ef4444',

        tension:0.4,

        fill:false

      }]

    },

    options:{

      responsive:true,

      plugins:{

        legend:{

          display:false

        }

      }

    }

  });

}
