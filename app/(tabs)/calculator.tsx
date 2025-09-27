import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CalculatorType = 'concrete' | 'brick' | 'paint' | 'electricity';
type BrickType = 'small' | 'standard' | 'big';
type VoltageType = '120V' | '240V' | '415V';
type SafetyFactorType = '1.0' | '1.25' | '1.5';

interface Appliance {
  id: string;
  name: string;
  power: string;
  amount: string;
}

export default function CalculatorScreen() {
  // Calculator type selection
  const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType>('concrete');
  
  // Common fields
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [pricePerBag, setPricePerBag] = useState('');
  
  // Concrete specific fields
  const [concreteResults, setConcreteResults] = useState<{
    volume: number;
    bags: number;
    totalCost: number;
  } | null>(null);
  
  // Brick specific fields
  const [wallLength, setWallLength] = useState('');
  const [wallWidth, setWallWidth] = useState('');
  const [brickType, setBrickType] = useState<BrickType>('standard');
  const [mortalThickness, setMortalThickness] = useState('');
  const [wastePercentage, setWastePercentage] = useState('10');
  const [brickPricePerUnit, setBrickPricePerUnit] = useState('');
  const [showBrickTypeDropdown, setShowBrickTypeDropdown] = useState(false);
  const [brickResults, setBrickResults] = useState<{
    bricksNeeded: number;
    totalCost: number;
  } | null>(null);
  
  // Paint specific fields
  const [totalWallArea, setTotalWallArea] = useState('');
  const [doorArea, setDoorArea] = useState('');
  const [numberOfCoats, setNumberOfCoats] = useState('2');
  const [coverage, setCoverage] = useState('10');
  const [paintPricePerLiter, setPaintPricePerLiter] = useState('');
  const [paintResults, setPaintResults] = useState<{
    litersNeeded: number;
    totalCost: number;
  } | null>(null);
  
  // Electrical specific fields
  const [systemVoltage, setSystemVoltage] = useState<VoltageType>('240V');
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: '1', name: 'First', power: '2', amount: '2' }
  ]);
  const [safetyFactor, setSafetyFactor] = useState<SafetyFactorType>('1.25');
  const [electricalPricePerKwh, setElectricalPricePerKwh] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [showVoltageDropdown, setShowVoltageDropdown] = useState(false);
  const [showSafetyDropdown, setShowSafetyDropdown] = useState(false);
  const [electricalResults, setElectricalResults] = useState<{
    totalPower: number;
    dailyCost: number;
    monthlyCost: number;
  } | null>(null);

  const calculatorTypes = [
    { 
      type: 'concrete' as CalculatorType, 
      name: 'Concrete', 
      image: require('../../assets/images/calculator/concrete.png') 
    },
    { 
      type: 'brick' as CalculatorType, 
      name: 'Brick', 
      image: require('../../assets/images/calculator/brick.png') 
    },
    { 
      type: 'paint' as CalculatorType, 
      name: 'Paint', 
      image: require('../../assets/images/calculator/paint.png') 
    },
    { 
      type: 'electricity' as CalculatorType, 
      name: 'Electricity', 
      image: require('../../assets/images/calculator/electricity.png') 
    },
  ];

  const brickTypes = [
    { id: 'small' as BrickType, name: 'Small (200x65mm)' },
    { id: 'standard' as BrickType, name: 'Standart (215x65mm)' },
    { id: 'big' as BrickType, name: 'Big (200x99mm)' },
  ];

  const voltageTypes = [
    { id: '120V' as VoltageType, name: '120V' },
    { id: '240V' as VoltageType, name: '240V' },
    { id: '415V' as VoltageType, name: '415V (3-phase)' },
  ];

  const safetyFactors = [
    { id: '1.0' as SafetyFactorType, name: '1.0 (Bo safety margin)' },
    { id: '1.25' as SafetyFactorType, name: '1.25 (Standart 25%)' },
    { id: '1.5' as SafetyFactorType, name: '1.5 (Conservative 50%)' },
  ];

  const getCalculatorTitle = () => {
    switch (selectedCalculator) {
      case 'concrete': return 'Concrete Calculator';
      case 'brick': return 'Brick Calculator';
      case 'paint': return 'Paint Calculator';
      case 'electricity': return 'Electrical Calculator';
      default: return 'Calculator';
    }
  };

  const calculateConcrete = () => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const d = parseFloat(depth) || 0;
    const price = parseFloat(pricePerBag) || 0;
    
    // Convert cm to m
    const volumeM3 = (l * w * d) / 1000000;
    // Assume 1 bag covers 0.01 m³
    const bagsNeeded = Math.ceil(volumeM3 / 0.01);
    const totalCost = bagsNeeded * price;
    
    setConcreteResults({
      volume: volumeM3,
      bags: bagsNeeded,
      totalCost: totalCost
    });
  };

  const calculateBrick = () => {
    const wLength = parseFloat(wallLength) || 0;
    const wWidth = parseFloat(wallWidth) || 0;
    const waste = parseFloat(wastePercentage) || 0;
    const price = parseFloat(brickPricePerUnit) || 0;
    
    // Brick dimensions in cm
    const brickDimensions = {
      small: { length: 20, height: 6.5 },
      standard: { length: 21.5, height: 6.5 },
      big: { length: 20, height: 9.9 }
    };
    
    const brick = brickDimensions[brickType];
    const wallAreaCm2 = wLength * wWidth;
    const brickAreaCm2 = brick.length * brick.height;
    
    // Calculate bricks needed with waste
    const bricksNeeded = Math.ceil((wallAreaCm2 / brickAreaCm2) * (1 + waste / 100));
    const totalCost = bricksNeeded * price;
    
    setBrickResults({
      bricksNeeded: bricksNeeded,
      totalCost: totalCost
    });
  };

  const calculatePaint = () => {
    const wallArea = parseFloat(totalWallArea) || 0;
    const doors = parseFloat(doorArea) || 0;
    const coats = parseFloat(numberOfCoats) || 1;
    const coveragePerLiter = parseFloat(coverage) || 10;
    const price = parseFloat(paintPricePerLiter) || 0;
    
    // Calculate area to paint (wall area minus doors)
    const areaToPaint = Math.max(0, wallArea - doors);
    
    // Calculate liters needed
    const litersNeeded = (areaToPaint * coats) / coveragePerLiter;
    const totalCost = litersNeeded * price;
    
    setPaintResults({
      litersNeeded: Math.ceil(litersNeeded * 10) / 10, // Round to 1 decimal
      totalCost: totalCost
    });
  };

  const calculateElectrical = () => {
    const pricePerKwh = parseFloat(electricalPricePerKwh) || 0;
    const hours = parseFloat(hoursPerDay) || 8;
    const safety = parseFloat(safetyFactor) || 1.25;
    
    // Calculate total power consumption
    let totalPower = 0;
    appliances.forEach(appliance => {
      const power = parseFloat(appliance.power) || 0;
      const amount = parseFloat(appliance.amount) || 1;
      totalPower += (power * amount);
    });
    
    // Apply safety factor
    totalPower = totalPower * safety;
    
    // Calculate daily and monthly costs (kWh)
    const dailyKwh = (totalPower * hours) / 1000;
    const dailyCost = dailyKwh * pricePerKwh;
    const monthlyCost = dailyCost * 30;
    
    setElectricalResults({
      totalPower: totalPower,
      dailyCost: dailyCost,
      monthlyCost: monthlyCost
    });
  };

  const addAppliance = () => {
    const newAppliance: Appliance = {
      id: Date.now().toString(),
      name: '',
      power: '',
      amount: ''
    };
    setAppliances([...appliances, newAppliance]);
  };

  const removeAppliance = (id: string) => {
    setAppliances(appliances.filter(app => app.id !== id));
  };

  const updateAppliance = (id: string, field: keyof Appliance, value: string) => {
    setAppliances(appliances.map(app => 
      app.id === id ? { ...app, [field]: value } : app
    ));
  };

  const renderCalculatorSelector = () => (
    <View style={styles.calculatorSelectorContainer}>
      <View style={styles.calculatorSelector}>
        {calculatorTypes.map((calc) => (
          <TouchableOpacity
            key={calc.type}
            style={[
              styles.calculatorButton,
              selectedCalculator === calc.type && styles.calculatorButtonActive
            ]}
            onPress={() => setSelectedCalculator(calc.type)}
          >
            <Image 
              source={calc.image} 
              style={styles.calculatorIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderConcreteCalculator = () => (
    <View style={styles.fieldsContainer}>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Length</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter lenght"
            placeholderTextColor="#a1a1a1"
            value={length}
            onChangeText={setLength}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>cm</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Width</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter width"
            placeholderTextColor="#a1a1a1"
            value={width}
            onChangeText={setWidth}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>cm</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Depth</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter depth"
            placeholderTextColor="#a1a1a1"
            value={depth}
            onChangeText={setDepth}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>cm</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Price per Bag</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter the price"
            placeholderTextColor="#a1a1a1"
            value={pricePerBag}
            onChangeText={setPricePerBag}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>$</Text>
        </View>
      </View>

      {concreteResults && (
        <>
          <View style={styles.separator} />
          <View style={styles.resultsContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Volume needed:</Text>
              <Text style={styles.resultValue}>{concreteResults.volume.toFixed(2)} m³</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Bags needed:</Text>
              <Text style={styles.resultValue}>{concreteResults.bags} bags</Text>
            </View>
            {pricePerBag && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total cost:</Text>
                <Text style={styles.resultValue}>${concreteResults.totalCost.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  const renderBrickCalculator = () => (
    <View style={styles.fieldsContainer}>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Wall Length</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter lenght"
            placeholderTextColor="#a1a1a1"
            value={wallLength}
            onChangeText={setWallLength}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>cm</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Wall Width</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter width"
            placeholderTextColor="#a1a1a1"
            value={wallWidth}
            onChangeText={setWallWidth}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>cm</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Brick Tipe</Text>
        <TouchableOpacity 
          style={styles.dropdownContainer}
          onPress={() => setShowBrickTypeDropdown(!showBrickTypeDropdown)}
        >
          <Text style={styles.dropdownText}>
            {brickTypes.find(b => b.id === brickType)?.name}
          </Text>
          <Ionicons name="chevron-down" size={24} color="#ffffff" />
        </TouchableOpacity>
        {showBrickTypeDropdown && (
          <View style={styles.dropdownMenu}>
            {brickTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setBrickType(type.id);
                  setShowBrickTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Mortal Thickness</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter thickness"
            placeholderTextColor="#a1a1a1"
            value={mortalThickness}
            onChangeText={setMortalThickness}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>mm</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Waste Percentage</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="10 %"
            placeholderTextColor="#a1a1a1"
            value={wastePercentage}
            onChangeText={setWastePercentage}
            keyboardType="numeric"
          />
          <Ionicons name="caret-up-down" size={24} color="#a1a1a1" />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Price per Brick</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter price per brick"
            placeholderTextColor="#a1a1a1"
            value={brickPricePerUnit}
            onChangeText={setBrickPricePerUnit}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>$</Text>
        </View>
      </View>

      {brickResults && (
        <>
          <View style={styles.separator} />
          <View style={styles.resultsContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Bricks needed:</Text>
              <Text style={styles.resultValue}>{brickResults.bricksNeeded} bricks</Text>
            </View>
            {brickPricePerUnit && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total cost:</Text>
                <Text style={styles.resultValue}>${brickResults.totalCost.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  const renderPaintCalculator = () => (
    <View style={styles.fieldsContainer}>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Total Wall Area</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter total wall area"
            placeholderTextColor="#a1a1a1"
            value={totalWallArea}
            onChangeText={setTotalWallArea}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>m²</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Door Area</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter door area"
            placeholderTextColor="#a1a1a1"
            value={doorArea}
            onChangeText={setDoorArea}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>m²</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Number of Coats</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="2"
            placeholderTextColor="#a1a1a1"
            value={numberOfCoats}
            onChangeText={setNumberOfCoats}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Coverage (m² per liter)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="10"
            placeholderTextColor="#a1a1a1"
            value={coverage}
            onChangeText={setCoverage}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>m²</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Price per Liter</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter price per liter"
            placeholderTextColor="#a1a1a1"
            value={paintPricePerLiter}
            onChangeText={setPaintPricePerLiter}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>$</Text>
        </View>
      </View>

      {paintResults && (
        <>
          <View style={styles.separator} />
          <View style={styles.resultsContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Paint needed:</Text>
              <Text style={styles.resultValue}>{paintResults.litersNeeded} L</Text>
            </View>
            {paintPricePerLiter && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total cost:</Text>
                <Text style={styles.resultValue}>${paintResults.totalCost.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  const renderElectricalCalculator = () => (
    <View style={styles.fieldsContainer}>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>System Voltage (V)</Text>
        <TouchableOpacity 
          style={styles.dropdownContainer}
          onPress={() => setShowVoltageDropdown(!showVoltageDropdown)}
        >
          <Text style={styles.dropdownText}>{systemVoltage}</Text>
          <Ionicons name="chevron-down" size={24} color="#ffffff" />
        </TouchableOpacity>
        {showVoltageDropdown && (
          <View style={styles.dropdownMenu}>
            {voltageTypes.map((voltage) => (
              <TouchableOpacity
                key={voltage.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSystemVoltage(voltage.id);
                  setShowVoltageDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{voltage.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Appliances / Loads</Text>
        <View style={styles.appliancesContainer}>
          <View style={styles.applianceHeader}>
            <View style={styles.applianceHeaderCell}>
              <Text style={styles.applianceHeaderText}>Name</Text>
            </View>
            <View style={styles.applianceHeaderCell}>
              <Text style={styles.applianceHeaderText}>Power</Text>
              <Text style={styles.applianceHeaderUnit}>V</Text>
            </View>
            <View style={styles.applianceHeaderCell}>
              <Text style={styles.applianceHeaderText}>Amount</Text>
            </View>
            <View style={styles.applianceHeaderAction} />
          </View>
          
          {appliances.map((appliance) => (
            <View key={appliance.id} style={styles.applianceRow}>
              <View style={styles.applianceCell}>
                <TextInput
                  style={styles.applianceInput}
                  placeholder="Name"
                  placeholderTextColor="#a1a1a1"
                  value={appliance.name}
                  onChangeText={(value) => updateAppliance(appliance.id, 'name', value)}
                />
              </View>
              <View style={styles.applianceCell}>
                <TextInput
                  style={styles.applianceInput}
                  placeholder="Power"
                  placeholderTextColor="#a1a1a1"
                  value={appliance.power}
                  onChangeText={(value) => updateAppliance(appliance.id, 'power', value)}
                  keyboardType="numeric"
                />
                <Text style={styles.applianceUnit}>V</Text>
              </View>
              <View style={styles.applianceCell}>
                <TextInput
                  style={styles.applianceInput}
                  placeholder="Amount"
                  placeholderTextColor="#a1a1a1"
                  value={appliance.amount}
                  onChangeText={(value) => updateAppliance(appliance.id, 'amount', value)}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeAppliance(appliance.id)}
              >
                <Ionicons name="close-circle" size={28} color="#ff4656" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity style={styles.addApplianceButton} onPress={addAppliance}>
            <Text style={styles.addApplianceText}>Add Appliance</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Safety Factor</Text>
        <TouchableOpacity 
          style={styles.dropdownContainer}
          onPress={() => setShowSafetyDropdown(!showSafetyDropdown)}
        >
          <Text style={styles.dropdownText}>
            {safetyFactors.find(s => s.id === safetyFactor)?.name}
          </Text>
          <Ionicons name="chevron-down" size={24} color="#ffffff" />
        </TouchableOpacity>
        {showSafetyDropdown && (
          <View style={styles.dropdownMenu}>
            {safetyFactors.map((factor) => (
              <TouchableOpacity
                key={factor.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSafetyFactor(factor.id);
                  setShowSafetyDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{factor.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Hours per Day</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="8"
            placeholderTextColor="#a1a1a1"
            value={hoursPerDay}
            onChangeText={setHoursPerDay}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>hrs</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Price per kWh</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter price per kWh"
            placeholderTextColor="#a1a1a1"
            value={electricalPricePerKwh}
            onChangeText={setElectricalPricePerKwh}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>$</Text>
        </View>
      </View>

      {electricalResults && (
        <>
          <View style={styles.separator} />
          <View style={styles.resultsContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total power load:</Text>
              <Text style={styles.resultValue}>{electricalResults.totalPower.toFixed(0)} W</Text>
            </View>
            {electricalPricePerKwh && (
              <>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Daily cost:</Text>
                  <Text style={styles.resultValue}>${electricalResults.dailyCost.toFixed(2)}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Monthly cost:</Text>
                  <Text style={styles.resultValue}>${electricalResults.monthlyCost.toFixed(2)}</Text>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </View>
  );

  const renderCurrentCalculator = () => {
    switch (selectedCalculator) {
      case 'concrete': return renderConcreteCalculator();
      case 'brick': return renderBrickCalculator();
      case 'paint': return renderPaintCalculator();
      case 'electricity': return renderElectricalCalculator();
      default: return renderConcreteCalculator();
    }
  };

  const handleCalculate = () => {
    switch (selectedCalculator) {
      case 'concrete':
        calculateConcrete();
        break;
      case 'brick':
        calculateBrick();
        break;
      case 'paint':
        calculatePaint();
        break;
      case 'electricity':
        calculateElectrical();
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="calculator" size={28} color="#ffffff" />
          <Text style={styles.headerTitle}>{getCalculatorTitle()}</Text>
        </View>

        {/* Calculator Type Selector */}
        {renderCalculatorSelector()}

        {/* Calculator Fields */}
        {renderCurrentCalculator()}

        {/* Calculate Button */}
        <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
          <Text style={styles.calculateButtonText}>Calculate</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
    paddingBottom: 60,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 28,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#ffce00',
    fontFamily: 'Geologica',
    letterSpacing: -0.32,
    lineHeight: 24,
  },
  calculatorSelectorContainer: {
    marginBottom: 32,
  },
  calculatorSelector: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  calculatorButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'transparent',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorButtonActive: {
    backgroundColor: '#ffce00',
  },
  calculatorIcon: {
    width: 36,
    height: 36,
  },
  fieldsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  unitText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  dropdownMenu: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  resultsContainer: {
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  resultValue: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
  },
  appliancesContainer: {
    gap: 8,
  },
  applianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applianceHeaderCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  applianceHeaderText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  applianceHeaderUnit: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  applianceHeaderAction: {
    width: 28,
  },
  applianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applianceCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  applianceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  applianceUnit: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addApplianceButton: {
    backgroundColor: '#a1a1a1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addApplianceText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#050508',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
  },
  calculateButton: {
    backgroundColor: '#ffce00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  calculateButtonText: {
    color: '#050508',
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'Geologica',
    lineHeight: 26,
  },
});