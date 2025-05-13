import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../firebase';
import originalDepartmentsData from '../assets/departments.json';
import originalMajorsData from '../assets/majors.json';
import originalModulesData from '../assets/modules.json';
import transformCatalogueData from '../utils/catalogueTransformer';
import surreyJson from '../surrey_catalogue.json';

const MajorsModulesContext = createContext();

export const useMajorsModules = () => useContext(MajorsModulesContext);

export const MajorsModulesProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Transform the surrey_catalogue.json data
      const { departments: transformedDepartments, majors: transformedMajors, modules: transformedModules } = transformCatalogueData();
      
      // Check if we have transformed data
      if (transformedDepartments.length > 0) {
        setDepartments(transformedDepartments);
      } else {
        // Fallback to original data if transformation failed
        setDepartments(originalDepartmentsData);
      }
      
      if (transformedMajors.length > 0) {
        setMajors(transformedMajors);
      } else {
        setMajors(originalMajorsData);
      }
      
      if (transformedModules.length > 0) {
        setModules(transformedModules);
      } else {
        setModules(originalModulesData);
      }
    } catch (error) {
      console.error('Error transforming surrey catalogue data:', error);
      // Fallback to original data on error
      setDepartments(originalDepartmentsData);
      setMajors(originalMajorsData);
      setModules(originalModulesData);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MajorsModulesContext.Provider value={{ departments, majors, modules, loading }}>
      {children}
    </MajorsModulesContext.Provider>
  );
};