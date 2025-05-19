import { createContext, useContext, useState, useEffect } from 'react';
import originalDepartmentsData from '../assets/departments.json';
import originalMajorsData from '../assets/majors.json';
import originalModulesData from '../assets/modules.json';
import transformCatalogueData from '../utils/catalogueTransformer';

const MajorsModulesContext = createContext();

export const useMajorsModules = () => {
  const context = useContext(MajorsModulesContext);
  if (!context) {
    throw new Error('useMajorsModules must be used within a MajorsModulesProvider');
  }
  return context;
};

export const MajorsModulesProvider = ({ children }) => {
  const [modules, setModules] = useState([]);
  const [majors, setMajors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Transform the surrey_catalogue.json data
      const { departments: transformedDepartments, majors: transformedMajors, modules: transformedModules } = transformCatalogueData();
      
      // Check if we have transformed data
      if (transformedDepartments.length > 0) {
        setDepartments(transformedDepartments);
        setModules(transformedModules);
      } else {
        // Fallback to original data if transformation failed
        setDepartments(originalDepartmentsData);
        setModules(originalModulesData);
      }
      
      if (transformedMajors.length > 0) {
        setMajors(transformedMajors);
      } else {
        setMajors(originalMajorsData);
      }
    } catch (error) {
      console.error('Error transforming surrey catalogue data:', error);
      // Fallback to original data on error
      setDepartments(originalDepartmentsData);
      setModules(originalModulesData);
      setMajors(originalMajorsData);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MajorsModulesContext.Provider value={{ modules, majors, departments, loading }}>
      {children}
    </MajorsModulesContext.Provider>
  );
};