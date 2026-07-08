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

            alert("Complete todos los campos obligatorios.");

            return;

        }

        //==============================
        // CREAR AUDITORÍA
        //==============================

        const {

            data,

            error

        } =

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

            alert("Error guardando la auditoría.");

            return;

        }

        const auditoriaId = data.id;

        //==============================
        // SUBIR DOCUMENTOS
        //==============================

        for(const archivo of documentosSeleccionados){

            const nombreStorage =

                Date.now() +

                "_" +

                archivo.name;

            const rutaStorage =

                auditoriaId +

                "/" +

                nombreStorage;

            const subida =

            await window.supabaseClient

            .storage

            .from("auditorias")

            .upload(

                rutaStorage,

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

            const guardarDocumento =

            await window.supabaseClient

            .from("auditoria_documentos")

            .insert([{

                auditoria_id: auditoriaId,

                nombre_archivo: archivo.name,

                ruta_storage: rutaStorage,

                tipo_archivo: extension,

                tamano: archivo.size

            }]);

            if(guardarDocumento.error){

                console.log(

                    guardarDocumento.error

                );

            }

        }

        //==============================
        // HISTORIAL
        //==============================

        if(typeof guardarHistorial === "function"){

            await guardarHistorial(

                "CREAR",

                "AUDITORIAS",

                "Nueva auditoría: " +

                nombre

            );

        }

limpiarFormulario();

await window.renderAuditorias();

alert("Auditoría registrada correctamente.");

}

catch(error){

    console.log(error);

    alert("Ocurrió un error inesperado.");

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

limpiarDocumentos();

}

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

window.verDocumentos = async function(id){

    console.log("========== VER DOCUMENTOS ==========");
    console.log("ID Auditoría:", id);

    try{

        const modal =
        document.getElementById("modalDocumentos");

        const lista =
        document.getElementById("listaDocumentosModal");

        console.log("Modal:", modal);
        console.log("Lista:", lista);

        if(!modal){

            console.error("No existe #modalDocumentos");

            return;

        }

        if(!lista){

            console.error("No existe #listaDocumentosModal");

            return;

        }

        lista.innerHTML = "";

        const { data, error } =

        await window.supabaseClient

        .from("auditoria_documentos")

        .select("*")

        .eq("auditoria_id", id)

        .order("id");

        console.log("Respuesta Supabase:", data);

        console.log("Error:", error);

        if(error){

            console.error(error);

            alert("Error consultando documentos.");

            return;

        }

        if(!data || data.length === 0){

            lista.innerHTML = `

                <p style="text-align:center;padding:20px;">

                    No existen documentos para esta auditoría.

                </p>

            `;

            console.log("Abriendo modal sin documentos...");

            modal.classList.add("active");

            return;

        }

        data.forEach(function(doc){

            lista.innerHTML += `

                <div class="documento-storage">

                    <div>

                        <strong>

                            📄 ${doc.nombre_archivo}

                        </strong>

                        <br>

                        ${doc.tipo_archivo}

                    </div>

                    <div>

                        <button

                            class="btn-primary"

                            onclick="descargarDocumento('${doc.ruta_storage}')"

                        >

                            Descargar

                        </button>

                    </div>

                </div>

            `;

        });

        console.log("Abriendo modal con documentos...");

        modal.classList.add("active");

    }

    catch(error){

        console.error("Error inesperado:", error);

    }

}

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

window.descargarDocumento = async function(ruta){

    try{

        const {data,error}=

        await window.supabaseClient

        .storage

        .from("auditorias")

        .createSignedUrl(

            ruta,

            60

        );

        if(error){

            console.log(error);

            return;

        }

        window.open(

            data.signedUrl,

            "_blank"

        );

    }

    catch(error){

        console.log(error);

    }

}
const cerrarModalDocumentos =
document.getElementById(
    "cerrarModalDocumentos"
);


if(cerrarModalDocumentos){

    cerrarModalDocumentos.onclick=function(){

        document

        .getElementById(

            "modalDocumentos"

        )

        .classList.remove(

            "active"

        );

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


