import React, { useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { showCustomToast } from './CustomToast';
import NumericPad from './NumericPad';
import config from '../context/ConfigEnv';

Modal.setAppElement('#root');

export default function AdvanceModal({
  isOpen,
  onClose,
  userData
}) {
  const [advanceAmount, setAdvanceAmount] = useState('');
  const currentDay = new Date().getDate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (advanceAmount === '' || advanceAmount < 1) {
      showCustomToast({
        type: 'error',
        message: 'Por favor, ingresa un monto válido'
      });
      return;
    } else if (advanceAmount > 400) {
      showCustomToast({
        type: 'warning',
        message: `Cantidad máxima: 400€. 
        Acude a RRHH`
      });
      return;
    }

    const res = await axios.post(`http://${config.url}:3000/procesarAnticipos`, { id_user: userData.data.id_user, nombre: userData.data.nombre, amount: advanceAmount, delegacion:config.delegacion });

    if (!res.data.success) {
      showCustomToast({
        type: 'error',
        message: `Error al procesar el anticipo,
        inténtalo más tarde`
      });
      return;
    }
    
    setAdvanceAmount('');

    showCustomToast({
      type: 'success',
      message: `Anticipo de ${advanceAmount}€ solicitado correctamente`,
      duration: 5000
    });

    onClose();
  };

  const handlePadPress = (key) => {
    if (key === '⌫') {
      setAdvanceAmount(prev => prev.slice(0, -1));
      return;
    }
    if (key === 'OK') return;

    setAdvanceAmount(prev => prev + key);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Anticipo"
      style={{
        content: {
          maxWidth: '900px',
          maxHeight: '80vh',
          margin: 'auto',
          border: '10px solid #3ED89C',
          borderRadius: '15px', 
          padding: '20px',
          alignContent: 'center'
        },
        overlay: {
          backgroundColor: 'rgba(0,0,0,0.5)',
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex justify-end pb-5">
          <button
            type="button"
            onClick={onClose}
            style={{ fontSize: '1.5rem', border: 'none', background: 'none' }}
          >
            ❌
          </button>
        </div>
        <p style={{ color: '#3ED89C', fontSize: '1.5rem', marginBottom: '10px', textAlign: 'center' }}>
          {
            advanceAmount === '' ? ' ' :
              currentDay >= 1 && currentDay < 10
              ? '*Se programará para el día 10 de este mes*'
              : currentDay >= 10 && currentDay < 20
              ? '*Se programará para el día 20 de este mes*'
              : currentDay >= 20
              ? '*Se programará para el día 10 del próximo mes*'
              : ''
          }
        </p>
        <input
          type="text"
          value={advanceAmount}
          placeholder="0 €"
          readOnly
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '2rem',
            textAlign: 'center',
            color: '#856594',
            border: '5px solid #856594',
            borderRadius: '10px',
            marginBottom: '20px'
          }}
        />

        <div className='flex justify-center'>
          <NumericPad onKeyPress={handlePadPress} />
        </div>

        <button
          type="submit"
          disabled={advanceAmount === ''}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '15px',
            fontSize: '3rem',
            backgroundColor: advanceAmount === '' ? 'gray' : '#3ED89C',
            color: 'white',
            borderRadius: '10px'
          }}
        >
          Solicitar anticipo
        </button>
      </form>
    </Modal>
  );
}
