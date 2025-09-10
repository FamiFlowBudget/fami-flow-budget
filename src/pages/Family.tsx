import { FamilyManagement } from '@/components/family/FamilyManagement';

const Family = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Familia</h1>
        <p className="text-muted-foreground">Administra tu familia, miembros e invitaciones</p>
      </div>
      
      <FamilyManagement />
    </div>
  );
};

export default Family;