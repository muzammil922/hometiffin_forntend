import React, { forwardRef, useState, useRef, useEffect } from 'react'

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'Select Date';
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  options, // Array of { value, label } for select inputs
  className = '',
  id,
  onChange, // Extracted so we can call it customly
  value,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const baseInputStyles = 'w-full px-4 py-3 rounded-2xl border bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200'
  const errorStyles = error ? 'border-rose-400 focus:ring-rose-400' : 'border-emerald-100 focus:ring-primary'

  // Custom Calendar Picker States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [localDate, setLocalDate] = useState('')
  const [openDirection, setOpenDirection] = useState('down')
  const containerRef = useRef(null)

  const displayVal = value !== undefined ? value : localDate;

  // Custom Select Dropdown States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [localSelect, setLocalSelect] = useState('')

  const selectDisplayVal = value !== undefined ? value : localSelect;
  const currentSelectedOpt = options?.find(opt => opt.value === selectDisplayVal);
  const selectDisplayLabel = currentSelectedOpt ? currentSelectedOpt.label : (options?.[0]?.label || '-- Select --');

  // Measure space when calendar is toggled to decide open direction (up vs down)
  useEffect(() => {
    if (isCalendarOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Calendar popover height is around ~350px.
      if (spaceBelow < 360 && rect.top > spaceBelow) {
        setOpenDirection('up');
      } else {
        setOpenDirection('down');
      }
    }
  }, [isCalendarOpen]);

  // Measure space when dropdown is toggled to decide open direction (up vs down)
  useEffect(() => {
    if (isDropdownOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Dropdown popover height is around ~260px.
      if (spaceBelow < 260 && rect.top > spaceBelow) {
        setOpenDirection('up');
      } else {
        setOpenDirection('down');
      }
    }
  }, [isDropdownOpen]);

  const handleDateSelect = (dateStr) => {
    setLocalDate(dateStr);
    setIsCalendarOpen(false);
    if (onChange) {
      onChange({ target: { name: props.name, value: dateStr } });
    }
  };

  const handleSelectOption = (optVal) => {
    setLocalSelect(optVal);
    setIsDropdownOpen(false);
    if (onChange) {
      onChange({ target: { name: props.name, value: optVal } });
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate calendar days
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = [];
  // Offset spaces for previous month days
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
  }

  // Active days buttons
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = dStr === displayVal;
    
    // Disable past days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
    const isPast = dayDate < today;

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isPast}
        onClick={() => handleDateSelect(dStr)}
        className={`w-10 h-10 text-xs font-semibold rounded-xl flex items-center justify-center transition-all ${
          isPast 
            ? 'text-gray-300 cursor-not-allowed bg-transparent'
            : isSelected
              ? 'bg-primary text-text-light font-bold shadow-subtle'
              : 'text-gray-700 hover:bg-accent-light hover:text-text-dark cursor-pointer'
        }`}
      >
        {d}
      </button>
    );
  }

  return (
    <div className={`w-full text-left relative ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-text-dark mb-1.5 ml-1">
          {label}
        </label>
      )}
      
      {type === 'select' ? (
        <div ref={containerRef} className="relative w-full">
          {/* Display box (styled as a premium input) */}
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`${baseInputStyles} ${errorStyles} flex items-center justify-between cursor-pointer select-none bg-white pr-4`}
          >
            <span className={selectDisplayVal ? 'text-gray-800 font-semibold' : 'text-gray-400'}>
              {selectDisplayLabel}
            </span>
            <svg className={`w-5 h-5 text-primary shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Hidden select for form registration/hook-form */}
          <input
            id={inputId}
            type="hidden"
            ref={ref}
            value={selectDisplayVal}
            onChange={onChange}
            {...props}
          />

          {isDropdownOpen && (
            <>
              {/* Overlay for clicking outside */}
              <div 
                className="fixed inset-0 z-30 bg-transparent" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              
              {/* Custom Premium Dropdown Popover */}
              <div className={`absolute left-0 z-40 bg-white border border-emerald-100 rounded-3xl p-2 shadow-card w-full select-none text-left max-h-60 overflow-y-auto scrollbar-none flex flex-col gap-0.5 ${
                openDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
              }`}>
                {options?.map((opt) => {
                  const isOptSelected = opt.value === selectDisplayVal;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                        isOptSelected
                          ? 'bg-primary text-text-light font-bold shadow-sm'
                          : 'text-gray-700 hover:bg-accent-light hover:text-text-dark'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : type === 'textarea' ? (
        <textarea
          id={inputId}
          ref={ref}
          value={value}
          onChange={onChange}
          className={`${baseInputStyles} ${errorStyles} min-h-[100px] resize-y`}
          {...props}
        />
      ) : type === 'date' ? (
        <div ref={containerRef} className="relative w-full">
          {/* Display box (styled as a premium input) */}
          <div 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`${baseInputStyles} ${errorStyles} flex items-center justify-between cursor-pointer select-none bg-white pr-4`}
          >
            <span className={displayVal ? 'text-gray-800 font-semibold' : 'text-gray-400'}>
              {formatDateDisplay(displayVal)}
            </span>
            <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Hidden input for react-hook-form integration */}
          <input
            id={inputId}
            type="hidden"
            ref={ref}
            value={displayVal}
            onChange={onChange}
            {...props}
          />

          {isCalendarOpen && (
            <>
              {/* Overlay to handle outside clicks */}
              <div 
                className="fixed inset-0 z-30 bg-transparent" 
                onClick={() => setIsCalendarOpen(false)} 
              />
              
              {/* Custom Premium Calendar Popover */}
              <div className={`absolute left-0 z-40 bg-white border border-emerald-100 rounded-3xl p-5 shadow-card w-[320px] select-none text-left ${
                openDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
              }`}>
                {/* Header: Month & Navigation */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-50">
                  <h4 className="font-extrabold text-sm text-text-dark">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h4>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="p-1.5 rounded-lg border border-emerald-100 text-primary hover:bg-accent-light transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-1.5 rounded-lg border border-emerald-100 text-primary hover:bg-accent-light transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Weekdays Row */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <div>Su</div>
                  <div>Mo</div>
                  <div>Tu</div>
                  <div>We</div>
                  <div>Th</div>
                  <div>Fr</div>
                  <div>Sa</div>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {days}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <input
          id={inputId}
          type={type}
          ref={ref}
          value={value}
          onChange={onChange}
          className={`${baseInputStyles} ${errorStyles}`}
          {...props}
        />
      )}
      
      {error && (
        <span className="text-xs text-rose-500 mt-1 ml-1 block">
          {error.message || error}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
