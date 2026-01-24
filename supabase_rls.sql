-- 1. Habilitar RLS en las tablas
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_detalle ENABLE ROW LEVEL SECURITY;

-- 2. Crear Política para 'ventas'

-- A. ADMIN: Puede hacer TODO (Select, Insert, Update, Delete)
CREATE POLICY "Admin puede ver todo ventas"
ON public.ventas
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE rol = 'admin' OR rol = 'administrador'
  )
);

-- B. VENDEDOR: Solo puede VER sus propias ventas
CREATE POLICY "Vendedor ve sus propias ventas"
ON public.ventas
FOR SELECT
USING (
  auth.uid() = usuario_id
);

-- C. VENDEDOR: Solo puede INSERTAR sus propias ventas
CREATE POLICY "Vendedor crea sus propias ventas"
ON public.ventas
FOR INSERT
WITH CHECK (
  auth.uid() = usuario_id
);

-- 3. Crear Política para 'venta_detalle'
-- (Depende de la venta padre)

-- A. ADMIN: Puede ver todo detalle
CREATE POLICY "Admin ve todo detalle"
ON public.venta_detalle
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE rol = 'admin' OR rol = 'administrador'
  )
);

-- B. VENDEDOR: Ve detalles SOLO si la venta le pertenece
CREATE POLICY "Vendedor ve detalles de sus ventas"
ON public.venta_detalle
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ventas
    WHERE ventas.id = venta_detalle.venta_id
    AND ventas.usuario_id = auth.uid()
  )
);

-- C. VENDEDOR: Inserta detalles SOLO si la venta le pertenece (y él la acaba de crear)
CREATE POLICY "Vendedor inserta detalles en sus ventas"
ON public.venta_detalle
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ventas
    WHERE ventas.id = venta_detalle.venta_id
    AND ventas.usuario_id = auth.uid()
  )
);
