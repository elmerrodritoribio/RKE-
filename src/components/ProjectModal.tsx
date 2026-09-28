import React, { useState } from 'react';
import { Project, PropertyType, ProcedureType, DestinationEntity } from '../types';
import { Briefcase, Building, Calendar, FileText, MapPin, User, X } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSave: (updated: Project) => void;
}

const DEPARTMENTS = [
  'AMAZONAS', 'ANCASH', 'APURIMAC', 'AREQUIPA', 'AYACUCHO', 'CAJAMARCA', 'CALLAO',
  'CUSCO', 'HUANCAVELICA', 'HUANUCO', 'ICA', 'JUNIN', 'LA LIBERTAD', 'LAMBAYEQUE',
  'LIMA', 'LORETO', 'MADRE DE DIOS', 'MOQUEGUA', 'PASCO', 'PIURA', 'PUNO',
  'SAN MARTIN', 'TACNA', 'TUMBES', 'UCAYALI'
];

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, project, onSave }) => {
  const [formData, setFormData] = useState<Project>({ ...project });

  if (!isOpen) return null;

  const handleChange = (field: keyof Project, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, updatedAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Datos del Proyecto y Expediente</h2>
              <p className="text-xs text-slate-400">Información para planos técnicos y memoria descriptiva</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          {/* Código y Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Código Único Expediente</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs uppercase font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Proyecto</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
          </div>

          {/* Predio y Propietario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre / Denominación del Predio</label>
              <input
                type="text"
                value={formData.propertyName}
                onChange={(e) => handleChange('propertyName', e.target.value)}
                placeholder="Ej. Fundo El Olivar, Lote 14 Mz. C"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Predio</label>
              <select
                value={formData.propertyType}
                onChange={(e) => handleChange('propertyType', e.target.value as PropertyType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
              >
                <option value="Rural">Rural</option>
                <option value="Urbano">Urbano</option>
                <option value="Agrícola">Agrícola</option>
                <option value="Eriazo">Eriazo</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          {/* Propietario y Documento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Propietario / Posesionario</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
                placeholder="Apellidos y Nombres / Razón Social"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">DNI / RUC</label>
              <input
                type="text"
                value={formData.docNumber}
                onChange={(e) => handleChange('docNumber', e.target.value)}
                placeholder="8 o 11 dígitos"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs font-mono"
              />
            </div>
          </div>

          {/* Ubicación Política */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Ubicación Política y Geográfica</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Departamento</label>
                <select
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Provincia</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-hidden text-xs uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Distrito</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-hidden text-xs uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Centro Poblado / Comunidad</label>
                <input
                  type="text"
                  value={formData.centerPopulated}
                  onChange={(e) => handleChange('centerPopulated', e.target.value)}
                  placeholder="Ej. C.P. San Juan"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Sector / Caserío / Valle</label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => handleChange('sector', e.target.value)}
                  placeholder="Ej. Sector El Molino"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
                />
              </div>
            </div>
          </div>

          {/* Trámite y Entidad Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Trámite Catastral</label>
              <select
                value={formData.procedureType}
                onChange={(e) => handleChange('procedureType', e.target.value as ProcedureType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
              >
                <option value="Inmatriculación">Inmatriculación (Primera de Dominio)</option>
                <option value="Subdivisión">Subdivisión / Independización</option>
                <option value="Acumulación">Acumulación de Lotes / Parcelas</option>
                <option value="Rectificación de Áreas y Linderos">Rectificación de Áreas y Linderos</option>
                <option value="Búsqueda Catastral">Búsqueda Catastral</option>
                <option value="Visación de Planos">Visación de Planos Municipal</option>
                <option value="Prescripción Adquisitiva">Prescripción Adquisitiva Notarial/Judicial</option>
                <option value="Saneamiento de Bienes Estatales">Saneamiento de Bienes Estatales (SBN)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Entidad de Destino</label>
              <select
                value={formData.destinationEntity}
                onChange={(e) => handleChange('destinationEntity', e.target.value as DestinationEntity)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
              >
                <option value="SUNARP (Registro de Predios)">SUNARP (Registro de Predios)</option>
                <option value="COFOPRI">COFOPRI</option>
                <option value="Gobierno Regional (GORE - Dirección de Agricultura)">Gobierno Regional (GORE - Agricultura)</option>
                <option value="Municipalidad Provincial">Municipalidad Provincial</option>
                <option value="Municipalidad Distrital">Municipalidad Distrital</option>
                <option value="MIDAGRI">MIDAGRI</option>
                <option value="SBN (Superintendencia Nacional de Bienes Estatales)">SBN (Bienes Estatales)</option>
              </select>
            </div>
          </div>

          {/* Profesional Responsable y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Profesional Responsable</label>
              <input
                type="text"
                value={formData.professional}
                onChange={(e) => handleChange('professional', e.target.value)}
                placeholder="Ing. / Arq."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Colegiatura (CIP / CAP)</label>
              <input
                type="text"
                value={formData.professionalReg}
                onChange={(e) => handleChange('professionalReg', e.target.value)}
                placeholder="Ej. CIP N° 123456"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Fecha de Levantamiento</label>
              <input
                type="date"
                value={formData.surveyDate}
                onChange={(e) => handleChange('surveyDate', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observaciones Técnicas</label>
            <textarea
              value={formData.observations}
              onChange={(e) => handleChange('observations', e.target.value)}
              rows={2}
              placeholder="Notas sobre el levantamiento, equipo GNSS empleado, hitos monumentados..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-hidden text-xs resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-emerald-950 transition"
            >
              Guardar Datos del Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
