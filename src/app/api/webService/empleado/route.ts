// src/app/api/webService/empleado/route.ts

import { NextRequest, NextResponse } from 'next/server';

const url = 'http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl';

export async function POST(request: NextRequest) {
  try {
    const { num_nom } = await request.json();

    if (!num_nom) {
      return NextResponse.json(
        { success: false, error: 'El número de nómina es requerido' },
        { status: 400 }
      );
    }

    console.log(`📩 Buscando empleado con num_nom: ${num_nom}`);

    const empObject = {
      emp: {
        num_nom: num_nom,
      },
    };

    // Importar soap dinámicamente
    const soap = await import('soap');
    
    // Crear cliente SOAP
    const client = await soap.createClientAsync(url);
    console.log('✅ Cliente SOAP creado exitosamente');

    // Ejecutar operación GetEmpleado
    const [result] = await client.GetEmpleadoAsync(empObject);
    console.log('📥 Respuesta del WS:', JSON.stringify(result, null, 2));

    // Verificar resultado
    if (result && result.GetEmpleadoResult) {
      const empleado = result.GetEmpleadoResult;

      // Validar fecha de baja
      let fechaBaja = null;
      if (empleado.fecha_baja) {
        const fechaBajaStr = empleado.fecha_baja.replace(
          /(\d{2})\/(\d{2})\/(\d{4}).*/,
          '$3-$2-$1'
        );
        fechaBaja = new Date(fechaBajaStr);
      }

      const hoy = new Date();

      // Si tiene fecha de baja anterior y NO es PENSIONADO, rechazar
      if (fechaBaja && fechaBaja < hoy && empleado.puesto !== 'PENSIONADO') {
        console.log('🚫 Empleado dado de baja');
        return NextResponse.json(
          {
            success: false,
            error: 'El empleado no fue encontrado o está dado de baja. Favor de contactar a Recursos Humanos.',
          },
          { status: 404 }
        );
      }

      console.log('✅ Empleado encontrado');
      return NextResponse.json({
        success: true,
        data: empleado,
      });
    } else {
      console.log('⚠ No se encontraron datos del empleado');
      return NextResponse.json(
        { success: false, error: 'No se encontraron datos del empleado' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error consumiendo el servicio SOAP:', error);
    return NextResponse.json(
      { success: false, error: 'Error en el servidor al consultar el empleado' },
      { status: 500 }
    );
  }
}