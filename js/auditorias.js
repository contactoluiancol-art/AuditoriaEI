// ==========================================
// AUDITORIAS.JS
// PARTE 1
// Inicialización y Registro
// ==========================================

// ============================
// LIMPIAR INTERVALOS
// ============================

if (window.refreshAuditoriasInterval) {

    clearInterval(window.refreshAuditoriasInterval);

}

// ============================
// LIMPIAR FUNCIONES GLOBALES
// ============================

delete window.renderAuditorias;
delete window.eliminarAuditoria;
delete window.editarEstado;
delete window.iniciarRefreshAuditorias;
delete window.verDocumentos;

// ============================
// VARIABLES
// ============================

const btnGuardarAuditoria =
document.getElementById("guardarAuditoria");

const btnAgregarDocumento =
document.getElementById("btnAgregarDocumento");

const documentoInput =
document.getElementById("documentoInput");

const listaDocumentos =
document.getElementById("listaDocumentos");

// ============================
// DOCUMENTOS TEMPORALES
// ============================

let documentosSeleccionados = [];

// ============================
// EVENTOS
// ============================

if(btnGuardarAuditoria){

    btnGuardarAuditoria.onclick = guardarAuditoria;

}

if(btnAgregarDocumento){

    btnAgregarDocumento.onclick = function(){

        documentoInput.click();

    };

}

if(documentoInput){

    documentoInput.onchange = agregarDocumentos;

}

// ======================================
// AGREGAR DOCUMENTOS
// ======================================

function agregarDocumentos(e){

    const archivos = [...e.target.files];

    archivos.forEach(function(archivo){

        const extension =
        archivo.name
        .split(".")
        .pop()
        .toLowerCase();

        if(

            extension !== "pdf" &&
            extension !== "xlsx" &&
            extension !== "xls"

        ){

            alert(

                "Solo se permiten archivos PDF o Excel."

            );

            return;

        }

        documentosSeleccionados.push(archivo);

    });

    renderDocumentos();

    documentoInput.value = "";

}

// ======================================
// RENDER DOCUMENTOS
// ======================================

function renderDocumentos(){

    if(!listaDocumentos){

        return;

    }

    listaDocumentos.innerHTML = "";

    if(documentosSeleccionados.length===0){

        listaDocumentos.innerHTML=

        `
        <div class="documento-vacio">

            📄 Ningún documento agregado.

        </div>
        `;

        return;

    }

    documentosSeleccionados.forEach(function(doc,index){

        const extension =
        doc.name.split(".").pop().toUpperCase();

        listaDocumentos.innerHTML +=

        `
        <div class="documento-item">

            <div class="documento-info">

                <div class="documento-nombre">

                    📄 ${doc.name}

                </div>

                <div class="documento-tipo">

                    ${extension}

                    ·

                    ${(doc.size/1024).toFixed(1)} KB

                </div>

            </div>

            <div class="documento-acciones">

                <button

                    class="btn-eliminar"

                    onclick="eliminarDocumentoTemporal(${index})"

                >

                    🗑

                </button>

            </div>

        </div>

        `;

    });

}

// ======================================
// ELIMINAR DOCUMENTO TEMPORAL
// ======================================

window.eliminarDocumentoTemporal=function(index){

    documentosSeleccionados.splice(index,1);

    renderDocumentos();

}

// ======================================
// GUARDAR AUDITORIA
// ======================================

async function guardarAuditoria(){

    try{

        if(

            !window.tienePermiso(
                "auditorias",
                "crear"
            )

        ){

            alert("No tiene permisos.");

            return;

        }

        const tipo =
        document.getElementById("tipoInput").value;

        const nombre =
        document.getElementById("nombreInput")
        .value
        .trim();

        const proceso =
        document.getElementById("procesoInput")
        .value
        .trim();

        const responsable =
        document.getElementById("responsableInput")
        .value
        .trim();

        const estado =
        document.getElementById("estadoInput")
        .value;

        const fecha =
        document.getElementById("fechaInput")
        .value;

        const observaciones =
        document.getElementById("observacionesInput")
        .value
        .trim();

        if(

            !tipo ||

            !nombre ||

            !proceso ||

            !responsable ||

            !fecha

        ){

            alert(

                "Complete todos los campos obligatorios."

            );

            return;

        }

        //==================================
        // POR AHORA SOLO GUARDA
        // LOS DATOS
        // STORAGE VIENE EN LA PARTE 3
        //==================================

        const response=

        await window.supabaseClient

        .from("auditorias")

        .insert([{

            tipo,

            nombre,

            proceso,

            responsable,

            estado,

            fecha,

            observaciones,

            created_at:new Date().toISOString()

        }]);

        if(response.error){

            console.log(response.error);

            alert("Error al guardar.");

            return;

        }

        if(typeof guardarHistorial==="function"){

            await guardarHistorial(

                "CREAR",

                "AUDITORIAS",

                "Nueva auditoría: "+nombre

            );

        }

        limpiarFormulario();

        renderDocumentos();

        await window.renderAuditorias();

        alert("Auditoría registrada correctamente.");

    }

    catch(error){

        console.log(error);

    }

}

// ======================================
// LIMPIAR FORMULARIO
// ======================================

function limpiarFormulario(){

    document.getElementById("tipoInput").value="";

    document.getElementById("nombreInput").value="";

    document.getElementById("procesoInput").value="";

    document.getElementById("responsableInput").value="";

    document.getElementById("estadoInput").value="Pendiente";

    document.getElementById("fechaInput").value="";

    document.getElementById("observacionesInput").value="";

    documentosSeleccionados=[];

}

// ==========================================
// PARTE 2
// Render - Editar - Eliminar
// ==========================================

// ============================
// RENDER AUDITORÍAS
// ============================

window.renderAuditorias = async function () {

    try {

        const body = document.getElementById("auditoriasBody");

        if (!body) return;

        body.innerHTML = "";

        const { data, error } = await window.supabaseClient

            .from("auditorias")

            .select("*")

            .order("created_at", {

                ascending: false

            });

        if (error) {

            console.log(error);

            return;

        }

        if (!data || data.length === 0) {

            body.innerHTML = `

                <tr>

                    <td colspan="8">

                        No existen auditorías registradas.

                    </td>

                </tr>

            `;

            return;

        }

        let html = "";

        data.forEach(function (item) {

            let estadoClass = "";

            switch (item.estado) {

                case "Pendiente":

                    estadoClass = "estado-pendiente";

                    break;

                case "En proceso":

                    estadoClass = "estado-proceso";

                    break;

                case "Finalizada":

                    estadoClass = "estado-finalizada";

                    break;

                default:

                    estadoClass = "estado-pendiente";

            }

            html += `

            <tr>

                <td>

                    ${item.tipo}

                </td>

                <td>

                    ${item.nombre}

                </td>

                <td>

                    ${item.proceso}

                </td>

                <td>

                    ${item.responsable}

                </td>

                <td>

                    <span class="${estadoClass}">

                        ${item.estado}

                    </span>

                </td>

                <td>

                    ${new Date(item.fecha).toLocaleDateString("es-CO")}

                </td>

                <td>

                    <button

                        class="btn-primary"

                        style="padding:8px 12px"

                        onclick="verDocumentos(${item.id})"

                    >

                        📁

                    </button>

                </td>

                <td>

                    <div class="acciones-tabla">

                        ${window.tienePermiso("auditorias","editar") ?

                        `

                        <button

                            class="btn-editar"

                            onclick="editarEstado(${item.id})"

                        >

                            ✏️

                        </button>

                        ` : ""}

                        ${window.tienePermiso("auditorias","eliminar") ?

                        `

                        <button

                            class="btn-eliminar"

                            onclick="eliminarAuditoria(${item.id})"

                        >

                            🗑️

                        </button>

                        ` : ""}

                    </div>

                </td>

            </tr>

            `;

        });

        body.innerHTML = html;

    }

    catch (error) {

        console.log(error);

    }

};

// ============================
// VER DOCUMENTOS
// ============================

window.verDocumentos = async function (id) {

    alert(

        "Aquí se mostrarán los documentos de la auditoría.\n\n" +

        "Esta función quedará conectada con Supabase Storage."

    );

};

// ============================
// ELIMINAR AUDITORÍA
// ============================

window.eliminarAuditoria = async function (id) {

    try {

        if (

            !window.tienePermiso(

                "auditorias",

                "eliminar"

            )

        ) {

            alert("No tiene permisos.");

            return;

        }

        const confirmar = confirm(

            "¿Eliminar esta auditoría?"

        );

        if (!confirmar) return;

        const { error } = await window.supabaseClient

            .from("auditorias")

            .delete()

            .eq("id", Number(id));

        if (error) {

            console.log(error);

            return;

        }

        if (typeof guardarHistorial === "function") {

            await guardarHistorial(

                "ELIMINAR",

                "AUDITORIAS",

                "Se eliminó una auditoría."

            );

        }

        await window.renderAuditorias();

    }

    catch (error) {

        console.log(error);

    }

};

// ============================
// EDITAR ESTADO
// ============================

window.editarEstado = async function (id) {

    try {

        if (

            !window.tienePermiso(

                "auditorias",

                "editar"

            )

        ) {

            alert("No tiene permisos.");

            return;

        }

        const nuevoEstado = prompt(

            "Nuevo estado:\n\nPendiente\nEn proceso\nFinalizada"

        );

        if (!nuevoEstado) return;

        const { error } = await window.supabaseClient

            .from("auditorias")

            .update({

                estado: nuevoEstado

            })

            .eq("id", Number(id));

        if (error) {

            console.log(error);

            return;

        }

        if (typeof guardarHistorial === "function") {

            await guardarHistorial(

                "EDITAR",

                "AUDITORIAS",

                "Se actualizó el estado de una auditoría."

            );

        }

        await window.renderAuditorias();

    }

    catch (error) {

        console.log(error);

    }

};

// ==========================================
// PARTE 3
// Inicialización
// Permisos
// Refresh
// ==========================================

// ============================
// REFRESH
// ============================

window.iniciarRefreshAuditorias = function () {

    if (window.refreshAuditoriasInterval) {

        clearInterval(window.refreshAuditoriasInterval);

    }

    window.refreshAuditoriasInterval =

    setInterval(async function () {

        try {

            const body =

            document.getElementById("auditoriasBody");

            if (!body) return;

            await window.renderAuditorias();

        }

        catch (error) {

            console.log(

                "Refresh Auditorías:",

                error

            );

        }

    }, 3000);

};

// ============================
// PERMISOS
// ============================

function aplicarPermisosAuditorias() {

    if (

        !window.tienePermiso(

            "auditorias",

            "crear"

        )

    ) {

        if (btnGuardarAuditoria) {

            btnGuardarAuditoria.style.display = "none";

        }

    }

}

// ============================
// CARGAR FECHA ACTUAL
// ============================

function cargarFechaActual() {

    const fecha =

    document.getElementById("fechaInput");

    if (!fecha) return;

    if (fecha.value === "") {

        const hoy = new Date();

        fecha.value =

        hoy.toISOString().split("T")[0];

    }

}

// ============================
// LIMPIAR DOCUMENTOS
// ============================

function limpiarDocumentos() {

    documentosSeleccionados = [];

    renderDocumentos();

}

// ============================
// RESETEAR MÓDULO
// ============================

function reiniciarModuloAuditorias() {

    limpiarFormulario();

    limpiarDocumentos();

}

// ============================
// PREPARADO STORAGE
// ============================

async function subirDocumentosStorage(idAuditoria) {

    console.log(

        "Pendiente integración con Storage.",

        idAuditoria

    );

}

// ============================
// PREPARADO DESCARGA
// ============================

async function descargarDocumento(idDocumento) {

    console.log(

        "Pendiente descarga.",

        idDocumento

    );

}

// ============================
// PREPARADO ELIMINAR DOCUMENTO
// ============================

async function eliminarDocumento(idDocumento) {

    console.log(

        "Pendiente eliminar documento.",

        idDocumento

    );

}

// ======================================
// GUARDAR AUDITORIA
// ======================================

async function guardarAuditoria(){

    try{

        if(
            !window.tienePermiso(
                "auditorias",
                "crear"
            )
        ){
            alert("No tiene permisos.");
            return;
        }

        const tipo =
        document.getElementById("tipoInput").value;

        const nombre =
        document.getElementById("nombreInput").value.trim();

        const proceso =
        document.getElementById("procesoInput").value.trim();

        const responsable =
        document.getElementById("responsableInput").value.trim();

        const estado =
        document.getElementById("estadoInput").value;

        const fecha =
        document.getElementById("fechaInput").value;

        const observaciones =
        document.getElementById("observacionesInput").value.trim();

        if(
            !tipo ||
            !nombre ||
            !proceso ||
            !responsable ||
            !fecha
        ){

            alert("Complete todos los campos.");

            return;

        }

        //==============================
        // CREA LA AUDITORIA
        //==============================

        const { data, error } =

        await window.supabaseClient

        .from("auditorias")

        .insert([{

            tipo,
            nombre,
            proceso,
            responsable,
            estado,
            fecha,
            observaciones

        }])

        .select()

        .single();

        if(error){

            console.log(error);

            alert("No fue posible guardar.");

            return;

        }

        const auditoriaId = data.id;

        //==============================
        // SUBIR DOCUMENTOS
        //==============================

        for(const archivo of documentosSeleccionados){

            const nombreArchivo =

            Date.now() +

            "_" +

            archivo.name;

            const ruta =

            auditoriaId +

            "/" +

            nombreArchivo;

            const subida =

            await window.supabaseClient

            .storage

            .from("auditorias")

            .upload(

                ruta,

                archivo

            );

            if(subida.error){

                console.log(subida.error);

                continue;

            }

            const extension =

            archivo.name

            .split(".")

            .pop()

            .toUpperCase();

            await window.supabaseClient

            .from("auditoria_documentos")

            .insert([{

                auditoria_id:auditoriaId,

                nombre_archivo:archivo.name,

                ruta_storage:ruta,

                tipo_archivo:extension,

                tamano:archivo.size,

                extension:extension

            }]);

        }

        //==============================
        // HISTORIAL
        //==============================

        if(typeof guardarHistorial==="function"){

            await guardarHistorial(

                "CREAR",

                "AUDITORIAS",

                "Nueva auditoría: " +

                nombre

            );

        }

        limpiarFormulario();

        renderDocumentos();

        await window.renderAuditorias();

        alert("Auditoría registrada correctamente.");

    }

    catch(error){

        console.log(error);

    }

}

// ============================
// INICIO
// ============================

(function iniciarModuloAuditorias() {

    aplicarPermisosAuditorias();

    cargarFechaActual();

    renderDocumentos();

    window.renderAuditorias();

    window.iniciarRefreshAuditorias();

})();


