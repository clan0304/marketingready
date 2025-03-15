import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { Business } from "@/types";

const FindworkPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);

  // Load businesses from local storage on component mount
  useEffect(() => {
    const savedBusinesses = localStorage.getItem('businesses');
    if (savedBusinesses) {
      try {
        setBusinesses(JSON.parse(savedBusinesses));
      } catch (error) {
        console.error("Failed to parse businesses from localStorage", error);
      }
    }
  }, []);

  // Save businesses to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('businesses', JSON.stringify(businesses));
  }, [businesses]);

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentBusiness(undefined);
    setIsEditing(false);
  };

  const openAddModal = () => {
    setCurrentBusiness(undefined);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (business: Business) => {
    setCurrentBusiness(business);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: Business) => {
    if (isEditing && currentBusiness?.id) {
      // Update existing business
      setBusinesses(prevBusinesses => 
        prevBusinesses.map(b => 
          b.id === currentBusiness.id ? { ...data, id: currentBusiness.id } : b
        )
      );
    } else {
      // Add new business with a unique ID
      const newBusiness = {
        ...data,
        id: Date.now().toString()
      };
      setBusinesses(prevBusinesses => [...prevBusinesses, newBusiness]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setBusinesses(prevBusinesses => 
      prevBusinesses.filter(business => business.id !== id)
    );
    closeModal();
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Business Directory</h1>
        <button 
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Business
        </button>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No businesses added yet. Click &apos;Add Business&apos; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map(business => (
            <div 
              key={business.id} 
              className="border rounded shadow hover:shadow-md p-4 cursor-pointer"
              onClick={() => openEditModal(business)}
            >
              <h2 className="text-xl font-semibold mb-2">{business.name}</h2>
              <p className="text-gray-600 mb-2">{business.location}</p>
              <p className="text-gray-500 text-sm mb-2">{business.email}</p>
              {business.description && (
                <p className="text-gray-700 text-sm line-clamp-2">{business.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          formType="business" // Specify that we want to use the business form
          initialData={currentBusiness}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
};

export default FindworkPage;