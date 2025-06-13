import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Select from 'react-select';
import { processVehicleTrip } from '../funcs/DriverFuncs';
import { showCustomToast } from './CustomToast';

Modal.setAppElement('#root');

export default function VehicleModal({
  isOpen,
  onClose,
  vehicleList,
  userData,
  onValidCard,
  tripState
}) {
  
  const [selectedVehicle, setSelectedVehicle] = useState(userData.data.last_vehicle);
  const [kmsSubmit, setKmsSubmit] = useState('');
  const [kmsProximaRevision, setKmsProximaRevision] = useState('');
  const [focusedInput, setFocusedInput] = useState('kmsSubmit');

  const handleSubmit = (e) => {
    if (kmsSubmit === '' || kmsProximaRevision === '' || selectedVehicle === '') {
      showCustomToast({ type: 'error', message: 'Por favor, completa todos los campos.' });
    } else {
      e.preventDefault();
      processVehicleTrip({
        userData,
        selectedVehicle: selectedVehicle?.value || '',
        kmsSubmit: kmsSubmit,
        kmsProximaRevisionManual: kmsProximaRevision,
      });
      // onClose();
      onValidCard(false); 
    }
  };

  const handlePadPress = (key) => {
    const updateValue = (value, setter) => {
      if (key === '⌫') return setter(value.slice(0, -1));
      if (key === 'OK') return;
      setter(value + key);
    };

    if (focusedInput === 'kmsSubmit') {
      updateValue(kmsSubmit, setKmsSubmit);
    } else if (focusedInput === 'kmsProximaRevision') {
      updateValue(kmsProximaRevision, setKmsProximaRevision);
    }
  };


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Vehicle Modal"
      style={{
        content: {
          maxWidth: '1500px',
          maxHeight: '80vh',
          margin: 'auto',
          border: '30px solid #856594',
          borderRadius: '10px',
          padding: '20px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ fontSize: '1.5rem', backgroundColor: '#EA4949', background: 'none', border: 'none' }}>
            ❌
          </button>
        </div>

        <h2 style={{ color: '#856594', marginBottom: '10px', fontSize: '1.5rem', textAlign: 'center' }}>

        </h2>
        
        <div className='flex '>
          <div className='w-1/2'>


        <div style={{width: '100%', padding: '10px', marginTop: '10px', fontSize: '1.5rem', color: '#856594', border: '10px solid #856594', borderRadius: '10px', textAlign: 'center' }}>
          <Select
            options={vehicleList}
            value={selectedVehicle}
            onChange={setSelectedVehicle}
            onFocus={() => setFocusedInput('matriculaVehiculo')}
            placeholder="Selecciona matrícula"
            isSearchable
            required
          />
        </div>

        <input
          type="text"
          placeholder="Ingresa Kilómetros"
          value={kmsSubmit}
          
          onFocus={() => setFocusedInput('kmsSubmit')}
          onChange={(e)=> setKmsSubmit(e.target.value)}
          style={{ width: '100%', padding: '10px', marginTop: '10px', fontSize: '1.5rem', color: '#856594', border: '10px solid #856594', borderRadius: '10px', textAlign: 'center' }}
          required
        />

        <input
          type="text"
          placeholder="Kms próxima revisión"
          value={kmsProximaRevision}
          
          onFocus={() => setFocusedInput('kmsProximaRevision')}
          onchange={(e) => setKmsProximaRevision(e.target.value)}
          style={{ width: '100%', padding: '10px', marginTop: '10px', fontSize: '1.5rem', color: '#856594', border: '10px solid #856594', borderRadius: '10px', textAlign: 'center' }}
        />
        
        <button
          type={kmsSubmit === '' || kmsProximaRevision === '' || selectedVehicle === '' ? 'button' : 'submit'}
          className={``}
          style={{
              width: '100%', padding: '10px', marginTop: '10px', fontSize: '2.5rem', backgroundColor: (kmsSubmit === '' || kmsProximaRevision === '' || selectedVehicle === '' ? 'gray' : '#856594'), color: 'white', borderRadius: '10px'
            }}
          
        >
          {tripState === 'processing' ? 'Finalizar Viaje' : 'Iniciar Viaje'}
        </button>

        </div>
        
        <div className='w-1/2 flex justify-center items-center'>
          <NumericPad className='w-1/2' onKeyPress={handlePadPress} />
        </div>
          
        </div>

        <h2 style={{ color: '#856594', marginTop: '40px', fontSize: '1rem', textAlign: 'center' }}>
          {/* {JSON.stringify(userData.data.inicio_viaje)}
          {JSON.stringify(userData.data.fin_viaje)} */}
          Último vehículo usado: {userData.data.last_vehicle}
          {/* {kmsProximaRevision}
          {kmsSubmit} */}
        </h2>


      </form>
    </Modal>
  );
}

const NumericPad = ({ onKeyPress }) => {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '⌫', '0'
  ];

  return (
    <div style={{
      width: '90%',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px'
    }}>
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onKeyPress(key)}
          style={{
            fontSize: '1rem',
            padding: '30px',
            backgroundColor: '#f0f0f0',
            border: '4px solid #856594',
            borderRadius: '10px',
            color: '#856594',
            fontWeight: 'bold'
          }}
        >
          {key}
        </button>
      ))}
    </div>
  );
};
